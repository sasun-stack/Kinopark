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
    en: "Enter the phone number you used to register on the KinoPark website and discover your movie personality 🎬",
    hy: "Գրիր այն հեռախոսահամարը, որով գրանցված ես ԿինոՊարկի կայքում, ու իմացիր՝ ինչ կինո-կերպար ես դու 🎬",
  },
};

export function t(lang: Lang, key: keyof typeof COPY): string {
  const entry = COPY[key];
  if (!entry) return key;
  return entry[lang] ?? entry.en;
}
