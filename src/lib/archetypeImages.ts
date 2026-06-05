/**
 * Per-archetype character art. Keyed by archetype id.
 *
 * Files live in /public/archetypes/. Only archetypes present in this map
 * render a character cut-out on their card; everything else falls back to
 * the text-only layout untouched. Add ids here as the illustrations land.
 */
const ARCHETYPE_IMAGES: Record<string, string> = {
  "anime-devotee": "/archetypes/anime-devotee.png",
};

export function getArchetypeImage(id: string): string | null {
  return ARCHETYPE_IMAGES[id] ?? null;
}
