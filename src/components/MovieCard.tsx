"use client";

import type { Archetype, Badge, CardStats, Reward } from "@/lib/archetypes";
import { KinoLogo } from "@/components/KinoLogo";
import { getArchetypeImage } from "@/lib/archetypeImages";

interface Props {
  archetype: Archetype;
  badge: Badge;
  stats: CardStats;
  insight: string;
  serial: string;
  /** Per-user promocode shown in the reward pill near the bottom. */
  promocode: string;
  /** The loyalty reward this code unlocks. Drives the reward label + eyebrow. */
  reward: Reward;
  /** When false, the promocode pill renders heavily CSS-blurred. */
  revealCode?: boolean;
}

/**
 * Cinema character card — clean & spacious. Six things on the card:
 *
 *   1. KP logo + behaviour badge (top strip)
 *   2. Huge archetype title + small genre tag
 *   3. Three stats — big numbers, tiny labels
 *   4. The insight line (the soul of the card)
 *   5. The loyalty reward + promocode (orange pill, blurred when revealCode=false)
 *   6. Serial + url (footer)
 *
 * 16:9 for shareable social unfurl. Container query units (cqw) so the same
 * component renders crisp at every scale.
 */
export function MovieCard({
  archetype,
  badge,
  stats,
  insight,
  serial,
  promocode,
  reward,
  revealCode = false,
}: Props) {
  const { title, genre, bg, ink, accent } = archetype;

  // Optional character art. When present, text content is pulled in from the
  // right to make room for the cut-out; otherwise the layout is untouched.
  const characterImage = getArchetypeImage(archetype.id);
  const contentRight = characterImage ? "36cqw" : "4cqw";

  // Explicit line breaks. Width-based wrapping reflows through html-to-image
  // (container-query units), clipping titles on export. For 1-2 word titles
  // one word per line; for 3-word ones (THE INDIE SOUL) keep it to 2 lines:
  // first word, then the rest joined.
  const titleWords = title.split(" ");
  const titleLines =
    titleWords.length >= 3
      ? [titleWords[0], titleWords.slice(1).join(" ")]
      : titleWords;

  // Title scaling. Horizontal fit is driven by the longest LINE (titles
  // render one word per line), not the full title length. The cap keeps the
  // two-line block + eyebrow + genre stamp clear of the stats row at the
  // bottom — at >7cqw two lines collide with the stats on short titles.
  const longestLine = Math.max(...titleLines.map((l) => l.length), 1);
  const multiline = titleLines.length > 1;
  const titleCap = multiline
    ? characterImage
      ? 7
      : 8.5
    : characterImage
      ? 9
      : 11.5;
  const titleDivisor = characterImage ? 95 : 125;
  const titleSize = `${Math.max(4.5, Math.min(titleCap, titleDivisor / longestLine))}cqw`;

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none"
      style={{
        aspectRatio: "16 / 9",
        background: bg,
        color: ink,
        containerType: "inline-size",
        fontFamily: "var(--font-body), system-ui, sans-serif",
        borderRadius: "1.5cqw",
      }}
    >
      {/* Atmospheric corner glows */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 60% 75% at 0% 100%, ${withAlpha(accent, 0.20)} 0%, transparent 60%), radial-gradient(ellipse 60% 75% at 100% 0%, ${withAlpha(accent, 0.10)} 0%, transparent 60%)`,
        }}
      />

      {/* Faint grain */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none mix-blend-soft-light opacity-25"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 320 320' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.5 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* ── Character art (optional, right-anchored cut-out) ─────────── */}
      {characterImage && (
        <>
          {/* Soft accent halo behind the character */}
          <div
            aria-hidden
            className="absolute pointer-events-none"
            style={{
              right: "0",
              bottom: "0",
              width: "40cqw",
              height: "52cqw",
              background: `radial-gradient(ellipse 60% 55% at 68% 58%, ${withAlpha(accent, 0.30)} 0%, transparent 70%)`,
            }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={characterImage}
            alt={`${title} character`}
            className="absolute pointer-events-none select-none"
            style={{
              right: "3cqw",
              bottom: "0",
              height: "53cqw",
              width: "auto",
              objectFit: "contain",
              objectPosition: "bottom",
              filter: "drop-shadow(0 0.8cqw 1.6cqw rgba(0,0,0,0.45))",
            }}
          />
        </>
      )}

      {/* ── Top strip: KP logo + behaviour badge ─────────────────────── */}
      <div
        className="absolute flex items-center justify-between"
        style={{ left: "4cqw", right: "4cqw", top: "4.5cqw" }}
      >
        <span style={{ height: "3cqw", display: "inline-flex" }}>
          <KinoLogo />
        </span>

        <BadgePill label={badge.label} />
      </div>

      {/* ── Title block — eyebrow + huge title + small genre stamp ───── */}
      <div
        className="absolute"
        style={{ left: "4cqw", right: contentRight, top: "22%" }}
      >
        <div
          style={{
            color: accent,
            fontSize: "1.15cqw",
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            fontWeight: 600,
            marginBottom: "1cqw",
          }}
        >
          Cinema Identity
        </div>

        <h2
          className="kp-display"
          style={{
            fontSize: titleSize,
            color: ink,
            fontWeight: 800,
            margin: 0,
            lineHeight: 0.95,
          }}
        >
          {titleLines.map((line, i) => (
            <span key={i} style={{ display: "block" }}>
              {line}
            </span>
          ))}
        </h2>

        <div
          style={{
            marginTop: "1.4cqw",
            color: accent,
            fontSize: "1.4cqw",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          {genre}
        </div>
      </div>

      {/* ── Stats row ──────────────────────────────────────────────── */}
      <div
        className="absolute flex items-end"
        style={{
          left: "4cqw",
          right: contentRight,
          bottom: "16cqw",
          gap: characterImage ? "3cqw" : "6cqw",
        }}
      >
        <Stat value={String(stats.moviesWatched)} label="Movies" accent={accent} ink={ink} />
        <Stat value={`${stats.premiumPct}%`} label="Premium" accent={accent} ink={ink} />
        <Stat value={`${stats.topGenrePct}%`} label={genre} accent={accent} ink={ink} />
      </div>

      {/* ── Insight callout ─────────────────────────────────────────── */}
      <div
        className="absolute flex items-center"
        style={{
          left: "4cqw",
          // The 36cqw text column accounts for the halo, but the character
          // cut-out itself only reaches ~26cqw in — let the insight run up
          // to the figure so it fits on a single line.
          right: characterImage ? "26cqw" : contentRight,
          bottom: "11cqw",
          gap: "1.2cqw",
          fontSize: "1.7cqw",
          fontWeight: 500,
        }}
      >
        <span
          style={{
            color: accent,
            fontSize: "2cqw",
            fontWeight: 800,
            lineHeight: 1,
          }}
        >
          🎬
        </span>
        <span style={{ color: ink, opacity: 0.92 }}>{insight}</span>
      </div>

      {/* ── Reward + promo row ──────────────────────────────────────── */}
      <div
        className="absolute flex items-center justify-between"
        style={{
          left: "4cqw",
          right: contentRight,
          bottom: "5.5cqw",
          gap: "2cqw",
        }}
      >
        <div className="flex flex-col" style={{ gap: "0.4cqw", minWidth: 0 }}>
          <div
            className="kp-display"
            style={{
              fontSize: "2.4cqw",
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: "-0.005em",
              textTransform: "uppercase",
              color: ink,
              display: "flex",
              alignItems: "center",
              gap: "0.8cqw",
            }}
          >
            <span style={{ color: accent, fontSize: "2cqw" }}>🎟️</span>
            <span>Free Salty Popcorn</span>
          </div>
          <div
            style={{
              color: accent,
              fontSize: "0.95cqw",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              fontWeight: 600,
              opacity: 0.85,
            }}
          >
            {archetype.title} Exclusive
          </div>
        </div>
        <span
          className="kp-display"
          style={{
            display: "inline-block",
            fontSize: "2.2cqw",
            color: "#CA4C16",
            letterSpacing: "0.1em",
            fontWeight: 800,
            fontFeatureSettings: "'tnum'",
            filter: revealCode ? "none" : "blur(6px)",
            transition: "filter 200ms ease",
            userSelect: revealCode ? "auto" : "none",
            whiteSpace: "nowrap",
          }}
        >
          {promocode}
        </span>
      </div>

      {/* ── Footer: serial + url ────────────────────────────────────── */}
      <div
        className="absolute flex items-center justify-between"
        style={{
          left: "4cqw",
          right: contentRight,
          bottom: "2.5cqw",
          fontSize: "1cqw",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          opacity: 0.45,
          fontWeight: 600,
        }}
      >
        <span>N° {serial} / 2026</span>
        <span>KINOPARK.AM</span>
      </div>
    </div>
  );
}

/* ── Building blocks ────────────────────────────────────────────────── */

function Stat({
  value,
  label,
  accent,
  ink,
}: {
  value: string;
  label: string;
  accent: string;
  ink: string;
}) {
  return (
    <div className="flex flex-col" style={{ gap: "0.4cqw", flex: 1, minWidth: 0 }}>
      <span
        className="kp-display"
        style={{
          color: ink,
          fontSize: "4.6cqw",
          fontWeight: 800,
          letterSpacing: "-0.025em",
          fontFeatureSettings: "'tnum'",
          lineHeight: 1,
        }}
      >
        {value}
      </span>
      <span
        style={{
          color: accent,
          fontSize: "1.05cqw",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          fontWeight: 600,
        }}
      >
        {label}
      </span>
    </div>
  );
}

function BadgePill({ label }: { label: string }) {
  return (
    <span
      className="flex items-center"
      style={{
        gap: "0.6cqw",
        padding: "0.7cqw 1.4cqw",
        background: "#CA4C16",
        color: "#FCFCFD",
        borderRadius: "10cqw",
        fontSize: "1.15cqw",
        fontWeight: 700,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        fontFamily: "var(--font-display), sans-serif",
        boxShadow: "0 0 3cqw rgba(202,76,22,0.45)",
      }}
    >
      <span style={{ fontSize: "0.95cqw", color: "#FFD23D" }}>◆</span>
      <span>{label}</span>
    </span>
  );
}

/* ── Colour helpers ─────────────────────────────────────────────────── */

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = hex.match(/^#?([0-9a-f]{6})$/i);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function withAlpha(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}
