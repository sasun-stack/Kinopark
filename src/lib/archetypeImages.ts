/**
 * Per-archetype character art. Keyed by archetype id.
 *
 * Files live in /public/archetypes/. Only archetypes present in this map
 * render a character cut-out on their card; everything else falls back to
 * the text-only layout untouched. Add ids here as the illustrations land.
 */
const ARCHETYPE_IMAGES: Record<string, string> = {
  cinephile: "/archetypes/cinephile.png",
  "anime-devotee": "/archetypes/anime-devotee.png",
  "drama-queen": "/archetypes/drama-queen.png",
  "horror-junkie": "/archetypes/horror-junkie.png",
  "scifi-nerd": "/archetypes/scifi-nerd.png",
  "action-hero": "/archetypes/action-hero.png",
  sleuth: "/archetypes/sleuth.png",
  "hopeless-romantic": "/archetypes/hopeless-romantic.png",
  "comedy-captain": "/archetypes/comedy-captain.png",
  "indie-soul": "/archetypes/indie-soul.png",
  "mystery-guest": "/archetypes/mystery-guest.png",
};

export function getArchetypeImage(id: string): string | null {
  return ARCHETYPE_IMAGES[id] ?? null;
}
