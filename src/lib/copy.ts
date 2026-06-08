/**
 * UI copy translations. Keyed by message id, then by language.
 *
 * Add new keys here and read them with `t(useLang(), "key")`. Keep both
 * languages in sync — if a key is missing in one language, English wins.
 */
import type { Lang } from "@/components/LanguageSwitcher";

type Dict = Record<string, { en: string; hy: string }>;

const COPY: Dict = {
  // Landing — main headline. Rendered as one block; <br /> handled at the
  // call site if needed.
  "landing.headline": {
    en: "Find Your Movie Personality",
    hy: "Բացահայտիր՝ ինչ կինո-կերպար ես դու",
  },
  // Landing — paragraph under the headline.
  "landing.description": {
    en: "Find out what kind of movie person you are. Enter the phone number you used to register on the KinoPark website and discover your movie personality 🎬",
    hy: "Գրիր այն հեռախոսահամարը, որով գրանցված ես ԿինոՊարկի կայքում, ու իմացիր՝ ինչ կինո-կերպար ես դու 🎬",
  },
  // Card back — loading line shown before the reveal flip.
  "cardback.copy": {
    en: "Your movie story is already written",
    hy: "Քո կինո-պատմությունն արդեն գրված է",
  },
  // Phone input submit button (idle state).
  "phoneInput.submit": {
    en: "Reveal My Personality",
    hy: "Բացահայտել իմ կերպարը",
  },
  // Phone input submit button (loading state).
  "phoneInput.submitLoading": {
    en: "Reading…",
    hy: "Կարդում ենք…",
  },
  // Footer link below the form — leads to /deck.
  "landing.browse": {
    en: "All Personalities →",
    hy: "Բոլոր կերպարները →",
  },
};

export function t(lang: Lang, key: keyof typeof COPY): string {
  const entry = COPY[key];
  if (!entry) return key;
  return entry[lang] ?? entry.en;
}
