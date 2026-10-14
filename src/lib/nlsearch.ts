/**
 * Natural-language job search without any AI service: a transparent keyword parser that turns a sentence like
 * "remote react internship paid in Hyderabad class of 2026" into the same filters the opportunities page already has.
 */
const TYPES: [RegExp, string][] = [
  [/\binternships?\b|\binterns?\b/, "INTERNSHIP"], [/\bgraduate trainee\b|\btrainee\b/, "GRADUATE_TRAINEE"], [/\bapprentice(ship)?s?\b/, "APPRENTICESHIP"],
  [/\bcampus\b/, "CAMPUS"], [/\bfreelance\b|\bcontract\b|\bproject work\b/, "FREELANCE"], [/\bchallenges?\b|\bhackathons?\b/, "CHALLENGE"], [/\bjobs?\b|\bfresher\b|\bfull[- ]time\b/, "JOB"],
];
const STOP = new Set(["a", "an", "the", "for", "and", "or", "in", "at", "with", "me", "my", "i", "want", "looking", "find", "show", "need", "roles", "role", "opportunities", "opportunity", "class", "of", "graduate", "batch", "to", "near", "work", "working", "on", "site", "onsite", "remote", "hybrid", "paid", "unpaid", "stipend", "jobs", "job", "internship", "internships", "intern", "interns", "fresher", "freshers"]);

export type Parsed = { q?: string; skill?: string; type?: string; mode?: string; pay?: string; location?: string; year?: string; summary: string[] };

export function parseNaturalQuery(input: string, knownCities: string[] = []): Parsed {
  let t = ` ${input.toLowerCase().replace(/[^a-z0-9+#.\s-]/g, " ").replace(/\s+/g, " ").trim()} `;
  const out: Parsed = { summary: [] };
  const take = (re: RegExp) => { const m = t.match(re); if (m) t = t.replace(re, " "); return m; };
  if (take(/\bremote\b|\bwork from home\b|\bwfh\b/)) { out.mode = "REMOTE"; out.summary.push("remote"); }
  else if (take(/\bhybrid\b/)) { out.mode = "HYBRID"; out.summary.push("hybrid"); }
  else if (take(/\bon[- ]?site\b|\bin office\b/)) { out.mode = "ONSITE"; out.summary.push("on-site"); }
  if (take(/\bunpaid\b/)) { out.pay = "unpaid"; out.summary.push("unpaid"); }
  else if (take(/\bpaid\b|\bstipend\b|\bsalary\b/)) { out.pay = "paid"; out.summary.push("paid"); }
  const y = take(/\b(?:class of |batch |graduating |graduate )?(20(?:2[4-9]))\b/); if (y) { out.year = y[1]; out.summary.push(`class of ${y[1]}`); }
  for (const [re, type] of TYPES) if (re.test(t)) { out.type = type; out.summary.push(type.toLowerCase().replace("_", " ")); break; }
  for (const c of knownCities) { const re = new RegExp(`\\b${c.toLowerCase().replace(/[^a-z0-9 ]/g, "")}\\b`); if (c && re.test(t)) { out.location = c; out.summary.push(`in ${c}`); t = t.replace(re, " "); break; } }
  if (!out.location) { const m = t.match(/\b(?:in|near|at)\s+([a-z]{3,20})\b/); if (m && !STOP.has(m[1])) { out.location = m[1][0].toUpperCase() + m[1].slice(1); out.summary.push(`in ${out.location}`); } }
  const words = t.split(" ").filter((w) => w && !STOP.has(w) && w !== out.location?.toLowerCase());
  if (words.length) { out.skill = words.slice(0, 2).join(" "); out.summary.push(`about "${out.skill}"`); }
  return out;
}
