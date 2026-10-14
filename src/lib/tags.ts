/** Candidate tags are short private labels. Normalised so "Strong Portfolio " and "strong portfolio" are one tag. */
export function cleanTag(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.replace(/[\u0000-\u001f,<>]/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
  return t.length >= 2 && t.length <= 30 ? t : null;
}
export const MAX_TAGS_PER_CANDIDATE = 10;
export const MAX_BULK = 50;
