/** Does a saved search match a listing? (pure, unit tested). An alert needs at least one filter; all filters it has must match. */
export type AlertCriteria = { q?: string | null; type?: string | null; mode?: string | null; location?: string | null };
export type ListingFacts = { title: string; type: string; workMode: string; location: string; skills: string[]; company: string };
const has = (hay: string, needle: string) => hay.toLowerCase().includes(needle.trim().toLowerCase());

export function alertMatches(a: AlertCriteria, o: ListingFacts): boolean {
  if (!(a.q?.trim() || a.type || a.mode || a.location?.trim())) return false;
  if (a.type && a.type !== o.type) return false;
  if (a.mode && a.mode !== o.workMode) return false;
  if (a.location?.trim() && !has(o.location, a.location)) return false;
  if (a.q?.trim() && !has([o.title, o.company, ...o.skills].join(" "), a.q)) return false;
  return true;
}
