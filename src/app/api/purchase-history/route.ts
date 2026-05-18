import { NextResponse } from "next/server";
import {
  ARCHETYPES,
  BADGES,
  buildInsight,
  buildPromocode,
  buildStats,
  pickRandomArchetype,
  pickRandomBadge,
  pickReward,
  type Archetype,
  type Badge,
  type CardStats,
  type Reward,
} from "@/lib/archetypes";

export type ApiResponse = {
  archetype: Archetype;
  badge: Badge;
  stats: CardStats;
  insight: string;
  serial: string;
  motivation: string;
  promocode: string;
  reward: Reward;
};

const ARCHETYPE_LINES: Record<string, string> = {
  cinephile: "You don't watch films, you study them. Your last six tickets read like a syllabus.",
  "anime-devotee": "Half your favourite scenes are silent. You came for the worlds, not the words.",
  "drama-queen": "You buy popcorn anyway, even though you'll be too busy crying to eat it.",
  "horror-junkie": "You came alone, on purpose. The lights went down and you smiled.",
  "scifi-nerd": "Other people pick a film. You pick a future. Your watch history reads like research.",
  "action-hero": "Sound system on, lights down, phone face-down. You are the reason the back row exists.",
  sleuth: "You hate trailers because they spoil. You love long shots because they don't.",
  "hopeless-romantic": "You bought two tickets even though you came alone — old habit. Train scenes still hit.",
  "comedy-captain": "You laugh first, loudest, and at the line before the punchline.",
  "indie-soul": "If a film has under 50,000 ratings, you're already in.",
};

const BADGE_LINES: Record<string, string> = {
  "premium-baby": "And you book the recliner every single time. Of course you do.",
  marathoner: "Three films a week, easily. The staff know your order.",
  "date-night": "Always two tickets. Weekend, evening. The popcorn arrives without being asked.",
  "lone-wolf": "One ticket, middle seat, no notes. You came to be alone in the dark.",
  "front-row": "Opening weekend or it can wait — but it usually can't.",
  "weekday-wizard": "Tuesday matinee, empty hall. You figured the secret out years ago.",
  "popcorn-loyalist": "Large salted, every time. The combo barely needs ordering.",
  "the-regular": "Every month without fail. The staff know your name.",
};

function generateSerial(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  return ((Math.abs(h) % 9000) + 1000).toString();
}

function isValidPhone(p: string): boolean {
  return /^\+374\d{8}$/.test(p);
}

async function fetchPurchaseHistory(phoneE164: string): Promise<unknown | null> {
  const baseUrl = process.env.API_BASE_URL;
  const token = process.env.API_TOKEN;
  if (!baseUrl || !token) return null;

  // External API expects digits only: "37491240225" (no leading +)
  const PhoneNumber = phoneE164.replace(/^\+/, "");

  try {
    const res = await fetch(`${baseUrl}/api/Payment/GetPurchaseHistory`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ PhoneNumber }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const phone = url.searchParams.get("phone")?.trim() ?? "";
  const archetypeOverride = url.searchParams.get("archetype")?.trim();
  const badgeOverride = url.searchParams.get("badge")?.trim();
  const promoOverride = url.searchParams.get("promo")?.trim();
  const rewardOverride = url.searchParams.get("reward")?.trim();

  if (!isValidPhone(phone)) {
    return NextResponse.json(
      { error: "Enter a valid Armenian mobile number." },
      { status: 400 },
    );
  }

  await new Promise((r) => setTimeout(r, 300));

  // Try real purchase history. Falls back to mock when env not configured
  // or upstream fails. TODO: once we know the response shape, classify
  // archetype/badge from real ticket data instead of seeded randomness.
  const history = await fetchPurchaseHistory(phone);
  void history;

  const forcedArch = archetypeOverride
    ? ARCHETYPES.find((a) => a.id === archetypeOverride)
    : null;
  const forcedBadge = badgeOverride ? BADGES.find((b) => b.id === badgeOverride) : null;

  const archetype = forcedArch ?? pickRandomArchetype(phone);
  const badge = forcedBadge ?? pickRandomBadge(phone);
  const stats = buildStats(phone, archetype);
  const insight = buildInsight(phone, archetype, stats);
  const serial = generateSerial(phone);
  const motivation = `${ARCHETYPE_LINES[archetype.id]} ${BADGE_LINES[badge.id]}`;
  const promocode = promoOverride
    ? promoOverride.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 24)
    : buildPromocode(phone, archetype);
  const reward = pickReward(archetype, rewardOverride);

  const body: ApiResponse = {
    archetype,
    badge,
    stats,
    insight,
    serial,
    motivation,
    promocode,
    reward,
  };

  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
