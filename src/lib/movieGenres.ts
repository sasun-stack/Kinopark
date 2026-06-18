/**
 * Title → genre lookup, harvested from KinoPark's public "showed movies"
 * archive (kinopark.am/am/showed-movies — ~900 films, all-time, each with a
 * `Genres` string). Lets us derive genres for a watched film by its title,
 * since the purchase-history API returns titles but no genre.
 *
 * Refresh: re-harvest the archive (it grows as new films screen) and replace
 * showedMoviesGenres.json. Matching is exact-on-normalised-title, so a new
 * film simply won't resolve until the dictionary includes it — never an error.
 */
import RAW from "@/lib/showedMoviesGenres.json";

// Format / language markers that prefix titles on both sides (purchase rows
// say "2D Arm Junior Mher", the archive says "Junior Mher"; the archive also
// carries "Kor …", "Jap …", "Rus Sub …"). Strip them so both normalise equal.
const PREFIX =
  /^\s*(2d|3d|4dx|imax|atmos|dolby|arm|eng|kor|jap|rus|sub|2д|3д|д|рус|арм)\b/;

function normalizeTitle(s: string): string {
  let t = (s ?? "").toLowerCase();
  while (PREFIX.test(t)) t = t.replace(PREFIX, "");
  return t.replace(/[^a-z0-9]/g, "");
}

// Pre-build the normalised-title → genre[] map once at module load.
const LOOKUP: Record<string, string[]> = {};
for (const [title, genres] of Object.entries(RAW as Record<string, string>)) {
  const key = normalizeTitle(title);
  if (!key) continue;
  LOOKUP[key] = genres
    .split("•")
    .map((g) => g.trim().toLowerCase())
    .filter(Boolean);
}

/** Genre tags for a watched film title, or [] if it isn't in the archive. */
export function lookupMovieGenres(rawTitle: string | null | undefined): string[] {
  if (!rawTitle) return [];
  return LOOKUP[normalizeTitle(rawTitle)] ?? [];
}
