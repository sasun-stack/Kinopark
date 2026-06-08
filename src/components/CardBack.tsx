"use client";

import { KinoLogo } from "@/components/KinoLogo";

/**
 * Card back — KinoPark dark base + atmospheric corner glows + the real
 * three-tree mark centred. Shown before the reveal flips to the front.
 */
export function CardBack() {
  return (
    <div
      className="relative w-full h-full overflow-hidden select-none"
      style={{
        aspectRatio: "16 / 9",
        background: "rgba(10, 10, 10, 0.55)",
        backdropFilter: "blur(20px) saturate(160%)",
        WebkitBackdropFilter: "blur(20px) saturate(160%)",
        borderRadius: "1.5cqw",
        containerType: "inline-size",
        color: "#FCFCFD",
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow:
          "inset 0 1px 0 0 rgba(255,255,255,0.1), 0 8px 32px rgba(0,0,0,0.4)",
      }}
    >
      {/* Top shimmer highlight — gives the glass edge */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-60"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
        }}
      />

      {/* Atmospheric corner glow — same as the landing hero */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 80% at 0% 100%, rgba(115,160,80,0.20) 0%, transparent 60%), radial-gradient(ellipse 60% 80% at 100% 0%, rgba(202,76,22,0.15) 0%, transparent 65%)",
        }}
      />

      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Centered three-tree mark + small green eyebrow underneath.
          Sizes step up on narrower cards (mobile) so the loading state
          stays readable when the container is ~340px wide. */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center kp-cardback-stack"
      >
        <span className="kp-cardback-mark" style={{ display: "inline-flex" }}>
          <KinoLogo markOnly />
        </span>

        <div
          className="kp-cardback-copy"
          style={{
            color: "#A8C53C",
            fontWeight: 600,
            letterSpacing: "0.02em",
            textAlign: "center",
            lineHeight: 1.3,
          }}
        >
          Your tickets tell a story. Let&apos;s read it.
        </div>
      </div>

      <style jsx>{`
        .kp-cardback-stack {
          gap: 1.6cqw;
        }
        .kp-cardback-mark {
          height: 10cqw;
        }
        .kp-cardback-copy {
          font-size: 2cqw;
          max-width: 70%;
        }
        @media (max-width: 640px) {
          .kp-cardback-stack {
            gap: 3cqw;
          }
          .kp-cardback-mark {
            height: 18cqw;
          }
          .kp-cardback-copy {
            font-size: 4cqw;
            max-width: 88%;
          }
        }
      `}</style>
    </div>
  );
}
