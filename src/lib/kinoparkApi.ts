import { BADGES, type Badge } from "@/lib/archetypes";

const BASE_URL = process.env.API_BASE_URL ?? "";
const TOKEN = process.env.API_TOKEN ?? "";

export type Transaction = {
  OrderId: string;
  TotalPrice: number;
  TransactionDate: string; // "DD-MM-YYYY HH:MM"
  TransactionType: number;
  Status: number;
};

export type TransactionsResponse = {
  HasError: boolean;
  Data?: {
    PageItemCount: number;
    CurrentPageNumber: number;
    TotalCount: number;
    Items: Transaction[];
  };
  ResponseMessage: string | null;
};

// NOTE: the live endpoint that responds is GetTransactionsHistory.
// The user is identified by the token, not by PhoneNumber — so today
// every caller will see the token owner's data. Replace API_TOKEN with
// a service token that accepts an arbitrary PhoneNumber when ready.
export async function getPurchaseHistory(
  _phoneNumber: string,
): Promise<TransactionsResponse | null> {
  if (!BASE_URL || !TOKEN) return null;

  try {
    const res = await fetch(
      `${BASE_URL}/api/Payment/GetTransactionsHistory`,
      {
        method: "POST",
        headers: {
          Authorization: TOKEN,
          "Content-Type": "application/json",
          Referer: "https://kinopark.am/",
          Origin: "https://kinopark.am",
        },
        body: JSON.stringify({}),
        cache: "no-store",
      },
    );
    if (!res.ok) return null;
    return (await res.json()) as TransactionsResponse;
  } catch {
    return null;
  }
}

export type TransactionDetail = {
  HasError: boolean;
  Data?: {
    MovieName?: { am: string; en: string };
    SessionTime?: string;
    Screen?: number;
    Tickets?: Array<{ RowIndex: number; ColumnIndex: number; Price: number }>;
    TotalAmount?: number;
    ConcessionItems?: { Items: unknown[]; GroupPrice: number };
  };
};

export async function getTransactionDetails(
  orderId: string,
): Promise<TransactionDetail | null> {
  if (!BASE_URL || !TOKEN) return null;

  try {
    const res = await fetch(`${BASE_URL}/api/Payment/GetTransactionDetails`, {
      method: "POST",
      headers: {
        Authorization: TOKEN,
        "Content-Type": "application/json",
        Referer: "https://kinopark.am/",
        Origin: "https://kinopark.am",
      },
      body: JSON.stringify({ OrderId: orderId }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as TransactionDetail;
  } catch {
    return null;
  }
}

// ---------- Analytics over transactions ----------

export type Insights = {
  moviesWatched: number;
  totalSpent: number;
  averageTicketPrice: number;
  premiumPct: number;
  marathonerScore: number;
  nightOwlScore: number;
  weekdayScore: number;
  regularityScore: number;
  hasConcessions: boolean;
};

function parseArmenianDate(s: string): Date | null {
  const m = s.match(/^(\d{2})-(\d{2})-(\d{4})\s+(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const [, dd, mm, yyyy, hh, mi] = m;
  return new Date(+yyyy, +mm - 1, +dd, +hh, +mi);
}

export function analyzeTransactions(items: Transaction[]): Insights {
  const ticketItems = items.filter((i) => i.TransactionType === 1);

  const moviesWatched = ticketItems.length;
  const totalSpent = ticketItems.reduce((s, i) => s + (i.TotalPrice ?? 0), 0);
  const averageTicketPrice =
    moviesWatched > 0 ? totalSpent / moviesWatched : 0;
  const premiumCount = ticketItems.filter((i) => i.TotalPrice >= 2500).length;
  const premiumPct =
    moviesWatched > 0 ? Math.round((premiumCount / moviesWatched) * 100) : 0;

  const byDay = new Map<string, number>();
  let nightCount = 0;
  let weekdayCount = 0;
  for (const t of ticketItems) {
    const d = parseArmenianDate(t.TransactionDate);
    if (!d) continue;
    const dayKey = d.toISOString().slice(0, 10);
    byDay.set(dayKey, (byDay.get(dayKey) ?? 0) + 1);
    if (d.getHours() >= 21) nightCount++;
    const dow = d.getDay();
    if (dow >= 1 && dow <= 5) weekdayCount++;
  }
  const marathonerScore = byDay.size > 0
    ? Math.max(...Array.from(byDay.values()))
    : 0;
  const nightOwlScore =
    moviesWatched > 0 ? Math.round((nightCount / moviesWatched) * 100) : 0;
  const weekdayScore =
    moviesWatched > 0 ? Math.round((weekdayCount / moviesWatched) * 100) : 0;

  const months = new Set<string>();
  for (const t of ticketItems) {
    const d = parseArmenianDate(t.TransactionDate);
    if (d) months.add(`${d.getFullYear()}-${d.getMonth()}`);
  }
  const regularityScore = months.size;

  return {
    moviesWatched,
    totalSpent,
    averageTicketPrice,
    premiumPct,
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
  if (insights.regularityScore >= 6) {
    return byId("the-regular") ?? BADGES[0];
  }
  if (insights.weekdayScore >= 70) {
    return byId("weekday-wizard") ?? BADGES[0];
  }
  if (insights.nightOwlScore >= 50) {
    return byId("front-row") ?? BADGES[0];
  }
  if (insights.averageTicketPrice < 1500) {
    return byId("lone-wolf") ?? BADGES[0];
  }
  if (insights.averageTicketPrice >= 3000) {
    return byId("date-night") ?? BADGES[0];
  }

  return byId("the-regular") ?? BADGES[0];
}
