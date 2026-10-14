// Pure-function tests for matching, natural-language search, profile feedback and the JD checker. Run: npm run test:unit
import assert from "node:assert/strict";
import { explainMatch } from "../src/lib/matching";
import { parseNaturalQuery } from "../src/lib/nlsearch";
import { checkJobDescription } from "../src/lib/jdcheck";
import { profileFeedback } from "../src/lib/feedback";
import { publicOrigin } from "../src/lib/origin";

let n = 0; const t = (name: string, fn: () => void) => { fn(); n++; console.log("PASS " + name); };

t("verified skills outrank self-declared, missing skills are listed, nothing is invented", () => {
  const m = explainMatch({ wantedSkills: ["React", "SQL", "Docker"], gradYears: ["2026"], student: { verified: ["react"], claimed: ["SQL"], graduationYear: 2026 } });
  assert.deepEqual(m.matchedVerified, ["React"]); assert.deepEqual(m.matchedClaimed, ["SQL"]); assert.deepEqual(m.missing, ["Docker"]);
  assert.equal(m.yearFit, "fits"); assert.equal(m.score, Math.round(((1 + 0.7) / 3) * 70 + 30));
  assert.ok(m.reasons.some((r) => r.startsWith("Self-declared (not yet verified)")));
});
t("no skills on the listing gives no score instead of a fake one", () => {
  assert.equal(explainMatch({ wantedSkills: [], gradYears: [], student: { verified: [], claimed: [], graduationYear: 2026 } }).score, null);
});
t("a graduation-year mismatch is flagged, not hidden", () => {
  const m = explainMatch({ wantedSkills: ["SQL"], gradYears: ["2025"], student: { verified: [], claimed: ["SQL"], graduationYear: 2027 } });
  assert.equal(m.yearFit, "does-not-fit"); assert.ok(m.reasons.some((r) => r.includes("Check eligibility")));
});
t("natural-language query becomes filters", () => {
  const p = parseNaturalQuery("remote react internship paid in Hyderabad class of 2026", ["Hyderabad"]);
  assert.equal(p.mode, "REMOTE"); assert.equal(p.type, "INTERNSHIP"); assert.equal(p.pay, "paid"); assert.equal(p.location, "Hyderabad"); assert.equal(p.year, "2026"); assert.equal(p.skill, "react");
});
t("unpaid is not mistaken for paid, junk input is safe", () => {
  assert.equal(parseNaturalQuery("unpaid writing internship").pay, "unpaid");
  const j = parseNaturalQuery("   ;;; <script>alert(1)</script> "); assert.ok(!("type" in j && j.type));
});
t("JD checker blocks fees and guarantees, warns about off-platform contact", () => {
  const f = checkJobDescription("Pay a registration fee of 500 and we guarantee a job. WhatsApp us.");
  assert.ok(f.filter((x) => x.level === "block").length === 2); assert.ok(f.some((x) => x.level === "warn" && x.text.includes("WhatsApp")));
});
t("a clean description passes without block flags", () => {
  const good = "You will build firmware for our sensor line and own small features end to end. You should have some embedded C and be curious about hardware. Selection has an assignment and two interview rounds. ".repeat(2);
  assert.equal(checkJobDescription(good).filter((x) => x.level === "block").length, 0);
});
t("profile feedback only asks for things, never invents them", () => {
  const f = profileFeedback({ headline: "Student", bio: null, city: null, githubUrl: null, graduationYear: null, skillsClaimed: ["C"], lookingFor: null }, { projects: [], evidence: 0, entries: 0 });
  assert.ok(f.filter((x) => x.level === "do-first").length >= 4); assert.ok(f.every((x) => !/you have \d+ evidence/i.test(x.text)));
});
t("OAuth origin prefers the configured https site URL over an internal proxy address", () => {
  const req = (h: Record<string, string>, origin: string) => ({ headers: { get: (k: string) => h[k.toLowerCase()] ?? null }, nextUrl: { origin } });
  assert.equal(publicOrigin(req({}, "http://localhost:3000"), "https://app.kalwings.com/"), "https://app.kalwings.com");
  assert.equal(publicOrigin(req({ "x-forwarded-host": "app.kalwings.com", "x-forwarded-proto": "https" }, "http://localhost:3000"), ""), "https://app.kalwings.com");
  assert.equal(publicOrigin(req({ "x-forwarded-host": "evil.com/x", "x-forwarded-proto": "https" }, "http://localhost:3000"), ""), "http://localhost:3000");
  assert.equal(publicOrigin(req({}, "http://localhost:3000"), "http://example.com"), "http://localhost:3000");
});
console.log(`\n${n} unit tests passed`);
