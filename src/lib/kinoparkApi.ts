import { BADGES, type Badge } from "@/lib/archetypes";
import { lookupMovieGenres } from "@/lib/movieGenres";

// Public endpoint — no auth, identifies the customer by PhoneNumber, so every
// caller now sees their OWN purchase history (no shared service token needed).
// Hard-coded host on purpose: a stale API_BASE_URL env var (left over from the
// old token-based endpoint) silently pointed us at the wrong host and made
// every lookup 404. If the host ever moves, change it here.
const ENDPOINT = "https://mobileapi.mallapp.am/api/kinopark/GetPurchaseHistoryByPhone";

/** One purchased movie session (ticket purchase). */
export type PurchaseItem = {
  MovieName: { am?: string | null; en?: string | null } | null;
  SessionId?: string | null;
  HallNumber?: number | null;
  TicketCount?: number | null;
  Amount?: number | null;
  PurchaseDate?: string | null; // ISO 8601, UTC
  SessionTime?: string | null; // ISO 8601, UTC
  // Optional — only present once the backend adds genres to this response
  // (the movie object already carries them in GetMovies). When absent, the
  // genre classifier returns null and archetype falls back to the phone hash.
  Genres?: string[] | null;
  GenresTranslation?: { am?: string | null; en?: string | null } | null;
};

/** Standard API wrapper. `Data` is the array directly (not `Data.Items`). */
export type PurchaseHistoryResponse = {
  Data?: PurchaseItem[] | null;
  HasError: boolean;
  Message?: string | null;
};

/**
 * Normalise whatever the user typed into the DB format `374XXXXXXXX`.
 * Strips `+`, spaces, parentheses, dashes; maps a leading `0` or a bare
 * 8-digit subscriber number onto the full country-code form. Returns the
 * digits unchanged if it can't confidently reshape them.
 */
export function normalizePhone(input: string): string {
  let d = (input ?? "").replace(/\D/g, ""); // drop +, spaces, (), -, etc.
  if (d.startsWith("00")) d = d.slice(2); // 00374... → 374...
  if (d.startsWith("374")) return d; // already full
  if (d.startsWith("0")) d = d.slice(1); // 0XXXXXXXX → XXXXXXXX
  if (d.length === 8) return `374${d}`; // bare subscriber → full
  return d;
}

export async function getPurchaseHistory(
  phoneNumber: string,
): Promise<PurchaseHistoryResponse | null> {
  const phone = normalizePhone(phoneNumber);

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ PhoneNumber: phone }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as PurchaseHistoryResponse;
  } catch {
    return null;
  }
}

// ---------- Helpers over the purchase items ----------

/** Title in the caller's locale, falling back to the other language. */
export function movieTitle(item: PurchaseItem, lang: "en" | "am" = "en"): string {
  const n = item.MovieName;
  if (!n) return "";
  const primary = lang === "am" ? n.am : n.en;
  const fallback = lang === "am" ? n.en : n.am;
  return (primary ?? fallback ?? "").trim();
}

/** Defensive: skip rows the backend should already have filtered out. */
function isTicketRow(item: PurchaseItem): boolean {
  return movieTitle(item).length > 0;
}

/**
 * Shift a UTC instant into Yerevan local time (UTC+4, no DST) so the UTC
 * getters on the returned Date read as local wall-clock values.
 */
function toYerevan(iso?: string | null): Date | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return new Date(t + 4 * 3600 * 1000);
}

// ---------- Analytics over purchase history ----------

export type Insights = {
  moviesWatched: number;
  totalSpent: number;
  averageTicketPrice: number;
  premiumPct: number;
  pairPct: number; // share of visits with 2+ tickets (date-night signal)
  marathonerScore: number; // most movies seen in a single day
  nightOwlScore: number; // % of sessions starting 21:00 or later
  weekdayScore: number; // % of sessions Mon–Fri
  regularityScore: number; // distinct months with a purchase
  hasConcessions: boolean;
};

export function analyzeTransactions(items: PurchaseItem[]): Insights {
  const rows = items.filter(isTicketRow);
  const moviesWatched = rows.length;

  let totalTickets = 0;
  let totalSpent = 0;
  let premiumCount = 0;
  let pairCount = 0;
  for (const r of rows) {
    const tickets = Math.max(1, r.TicketCount ?? 1);
    const amount = r.Amount ?? 0;
    totalTickets += tickets;
    totalSpent += amount;
    if (amount / tickets >= 2500) premiumCount++;
    if (tickets >= 2) pairCount++;
  }
  const averageTicketPrice = totalTickets > 0 ? totalSpent / totalTickets : 0;
  const premiumPct =
    moviesWatched > 0 ? Math.round((premiumCount / moviesWatched) * 100) : 0;
  const pairPct =
    moviesWatched > 0 ? Math.round((pairCount / moviesWatched) * 100) : 0;

  const byDay = new Map<string, number>();
  const months = new Set<string>();
  let nightCount = 0;
  let weekdayCount = 0;
  let dated = 0;
  for (const r of rows) {
    const session = toYerevan(r.SessionTime ?? r.PurchaseDate);
    if (session) {
      dated++;
      const dayKey = `${session.getUTCFullYear()}-${session.getUTCMonth()}-${session.getUTCDate()}`;
      byDay.set(dayKey, (byDay.get(dayKey) ?? 0) + 1);
      if (session.getUTCHours() >= 21) nightCount++;
      const dow = session.getUTCDay();
      if (dow >= 1 && dow <= 5) weekdayCount++;
    }
    const purchase = toYerevan(r.PurchaseDate ?? r.SessionTime);
    if (purchase) {
      months.add(`${purchase.getUTCFullYear()}-${purchase.getUTCMonth()}`);
    }
  }
  const denom = dated || moviesWatched || 1;
  const marathonerScore =
    byDay.size > 0 ? Math.max(...Array.from(byDay.values())) : 0;
  const nightOwlScore = Math.round((nightCount / denom) * 100);
  const weekdayScore = Math.round((weekdayCount / denom) * 100);
  const regularityScore = months.size;

  return {
    moviesWatched,
    totalSpent,
    averageTicketPrice,
    premiumPct,
    pairPct,
    marathonerScore,
    nightOwlScore,
    weekdayScore,
    regularityScore,
    hasConcessions: false,
  };
}

export function pickBadgeFromInsights(insights: Insights): Badge {
  const byId = (id: string) => BADGES.find((b) => b.id === id);

  if (insights.marathonerScore >= 3) {
    return byId("marathoner") ?? BADGES[0];
  }
  if (insights.premiumPct >= 60) {
    return byId("premium-baby") ?? BADGES[0];
  }
  if (insights.pairPct >= 50) {
    return byId("date-night") ?? BADGES[0];
  }
  if (insights.regularityScore >= 6) {
    return byId("the-regular") ?? BADGES[0];
  }
  if (insights.weekdayScore >= 70) {
    return byId("weekday-wizard") ?? BADGES[0];
  }
  if (insights.nightOwlScore >= 50) {
    return byId("front-row") ?? BADGES[0];
  }
  if (insights.pairPct <= 10 && insights.averageTicketPrice < 2000) {
    return byId("lone-wolf") ?? BADGES[0];
  }

  return byId("the-regular") ?? BADGES[0];
}

// ---------- Genre → archetype classification ----------

/**
 * Maps a raw genre tag (as the backend sends it — lower-cased English, e.g.
 * "horror", "sci-fi", "drama") onto one of the 10 archetype ids. Several
 * genres can point at the same archetype. Tags not listed here are ignored.
 *
 * This is the table that turns "what genres they actually watched" into a
 * cinema identity — the part that was impossible while the API gave us no
 * genre at all.
 */
const GENRE_TO_ARCHETYPE: Record<string, string> = {
  horror: "horror-junkie",
  thriller: "sleuth",
  mystery: "sleuth",
  crime: "sleuth",
  detective: "sleuth",
  noir: "sleuth",
  "sci-fi": "scifi-nerd",
  scifi: "scifi-nerd",
  "science fiction": "scifi-nerd",
  fantasy: "scifi-nerd",
  animation: "anime-devotee",
  anime: "anime-devotee",
  cartoon: "anime-devotee",
  family: "anime-devotee",
  kids: "anime-devotee",
  drama: "drama-queen",
  melodrama: "drama-queen",
  romance: "hopeless-romantic",
  romantic: "hopeless-romantic",
  comedy: "comedy-captain",
  action: "action-hero",
  adventure: "action-hero",
  war: "action-hero",
  western: "action-hero",
  military: "action-hero",
  documentary: "cinephile",
  biography: "cinephile",
  history: "cinephile",
  music: "cinephile",
  musical: "cinephile",
  concert: "cinephile",
  opera: "cinephile",
  ballet: "cinephile",
};

export type GenreMatch = {
  archetypeId: string;
  /** Share of mapped genre tags that landed on the winning archetype (0–100). */
  topGenrePct: number;
};

/**
 * Decide the archetype from real watch history by tallying every film's
 * genres onto archetypes and taking the leader. Returns null when none of
 * the rows carry a recognised genre (i.e. the backend hasn't added the field
 * yet) — the caller then falls back to the deterministic phone-hash pick.
 */
export function classifyArchetypeByGenre(
  items: PurchaseItem[],
  liveLookup?: (title: string) => string[],
): GenreMatch | null {
  const tally = new Map<string, number>();
  let totalHits = 0;
  for (const item of items) {
    // Genre source priority: (1) genres the API provides, (2) the live
    // current catalogue (covers new releases automatically), (3) the static
    // showed-movies archive (all-time history up to the last harvest).
    let genres = item.Genres && item.Genres.length ? item.Genres : null;
    if (!genres) {
      const title = movieTitle(item, "en") || movieTitle(item, "am");
      const fromLive = liveLookup ? liveLookup(title) : [];
      genres = fromLive.length ? fromLive : lookupMovieGenres(title);
    }
    if (!genres || genres.length === 0) continue;
    for (const raw of genres) {
      const tag = (raw ?? "").toLowerCase().trim();
      const archetypeId = GENRE_TO_ARCHETYPE[tag];
      if (!archetypeId) continue;
      tally.set(archetypeId, (tally.get(archetypeId) ?? 0) + 1);
      totalHits++;
    }
  }
  if (totalHits === 0) return null;

  let archetypeId: string | null = null;
  let best = -1;
  for (const [id, n] of tally) {
    if (n > best) {
      best = n;
      archetypeId = id;
    }
  }
  if (!archetypeId) return null;

  return {
    archetypeId,
    topGenrePct: Math.round((best / totalHits) * 100),
  };
}
