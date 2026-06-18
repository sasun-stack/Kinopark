/**
 * Live genre layer. Fetches KinoPark's current catalogue (GetMovies on
 * mobileapi.mallapp.am — same host as the purchase API, NOT behind the
 * Cloudflare wall that blocks the showed-movies archive) and exposes a
 * title→genre map. Any film currently screening — including this month's new
 * releases — carries its genres here, so a freshly-released film a user just
 * bought a ticket for resolves automatically, with no manual re-harvest.
 *
 * Cached in-module for one week: a warm serverless instance fetches at most
 * once per week; cold starts refetch. This is the always-fresh middle layer
 * between the API's own Genres (if ever added) and the static archive
 * snapshot (showedMoviesGenres.json) for older films.
 */
import { normalizeTitle } from "@/lib/movieGenres";

const CATALOG_URL = "https://mobileapi.mallapp.am/api/kinopark/GetMovies";
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 1 week

type GenreMap = Record<string, string[]>;

let cache: { at: number; map: GenreMap } | null = null;
let inflight: Promise<GenreMap> | null = null;

type CatalogMovie = {
  MovieName?: { en?: string | null; am?: string | null } | null;
  OriginalName?: string | null;
  Genres?: string[] | null;
};

function extract(json: unknown): GenreMap {
  const map: GenreMap = {};
  const data = (json as { Data?: Record<string, unknown> } | null)?.Data;
  if (!data) return map;
  const lists = ["TopMovies", "TodaysMovies", "UpComingMovies"];
  for (const listKey of lists) {
    const list = data[listKey];
    if (!Array.isArray(list)) continue;
    for (const raw of list as CatalogMovie[]) {
      const title = (
        raw?.MovieName?.en ||
        raw?.MovieName?.am ||
        raw?.OriginalName ||
        ""
      ).trim();
      const genres = Array.isArray(raw?.Genres) ? raw.Genres : [];
      const key = normalizeTitle(title);
      if (!key || genres.length === 0) continue;
      map[key] = genres
        .map((g) => (g ?? "").toLowerCase().trim())
        .filter(Boolean);
    }
  }
  return map;
}

/**
 * Current catalogue title→genre map, refreshed at most weekly. Never throws —
 * on a network/parse failure it returns the last good map (or {}), so a flaky
 * catalogue call can't break card generation.
 */
export async function getLiveGenreMap(): Promise<GenreMap> {
  const now = Date.now();
  if (cache && now - cache.at < TTL_MS) return cache.map;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const res = await fetch(CATALOG_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`catalog ${res.status}`);
      const map = extract(await res.json());
      cache = { at: now, map };
      return map;
    } catch {
      return cache?.map ?? {};
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}
