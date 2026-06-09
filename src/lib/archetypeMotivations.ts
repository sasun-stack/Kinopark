/**
 * Long-form personality descriptions per archetype, EN + HY.
 *
 * When an archetype has an entry here, the result screen renders it
 * instead of the server-built `data.motivation` line. Add entries as we
 * write the bespoke copy; missing archetypes keep the existing
 * archetype-line + badge-line combo.
 */
import type { Lang } from "@/components/LanguageSwitcher";

type Motivation = { en: string; hy: string };

const ARCHETYPE_MOTIVATIONS: Record<string, Motivation> = {
  "anime-devotee": {
    en: "Anime isn’t “just cartoons” for you. You love the stories, emotions, and worlds that stay with you long after the credits end 😌",
    hy: "Քեզ համար անիմեն պարզապես մուլտֆիլմ չէ։ Դու սիրում ես այն պատմությունները, զգացմունքներն ու աշխարհները, որոնք երկար ժամանակ մնում են մտքում։ Երբեմն նույնիսկ մեկ տեսարանը բավարար է, որ ամբողջ օրը դրա մասին մտածես 😌",
  },
};

export function getArchetypeMotivation(
  archetypeId: string,
  lang: Lang,
): string | null {
  const entry = ARCHETYPE_MOTIVATIONS[archetypeId];
  if (!entry) return null;
  return entry[lang] ?? entry.en;
}
