"use client";

import { useEffect, useState } from "react";

export type Lang = "en" | "hy";

const STORAGE_KEY = "kp-lang";

/**
 * Reads the current language from localStorage. Returns "en" on the server
 * or when nothing has been stored yet.
 */
export function getStoredLang(): Lang {
  if (typeof window === "undefined") return "en";
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === "hy" ? "hy" : "en";
}

export function setStoredLang(lang: Lang): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, lang);
  window.dispatchEvent(new CustomEvent("kp-lang-change", { detail: lang }));
}

/**
 * Subscribe a component to language changes. Returns the current language.
 * Use this in any component that needs to re-render when the user toggles.
 */
export function useLang(): Lang {
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    setLang(getStoredLang());
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<Lang>).detail;
      if (detail === "en" || detail === "hy") setLang(detail);
    };
    window.addEventListener("kp-lang-change", onChange);
    return () => window.removeEventListener("kp-lang-change", onChange);
  }, []);

  return lang;
}

/**
 * Compact `EN | ՀՅ` toggle that lives in the header pill.
 */
export function LanguageSwitcher() {
  const lang = useLang();

  const baseStyle = {
    fontSize: "0.85rem",
    fontWeight: 600,
    letterSpacing: "0.04em",
    cursor: "pointer",
    transition: "color 200ms",
    background: "none",
    border: "none",
    padding: 0,
  } as const;

  return (
    <div
      className="flex items-center"
      style={{ gap: "0.5rem", color: "rgba(252,252,253,0.45)" }}
    >
      <button
        type="button"
        onClick={() => setStoredLang("en")}
        aria-pressed={lang === "en"}
        aria-label="Switch to English"
        style={{
          ...baseStyle,
          color: lang === "en" ? "#FCFCFD" : "rgba(252,252,253,0.45)",
        }}
      >
        EN
      </button>
      <span aria-hidden style={{ opacity: 0.35 }}>|</span>
      <button
        type="button"
        onClick={() => setStoredLang("hy")}
        aria-pressed={lang === "hy"}
        aria-label="Փոխել հայերենի"
        style={{
          ...baseStyle,
          fontSize: "0.72rem",
          color: lang === "hy" ? "#FCFCFD" : "rgba(252,252,253,0.45)",
        }}
      >
        ՀՅ
      </button>
    </div>
  );
}
