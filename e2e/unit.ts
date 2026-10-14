// Pure-function tests for matching, natural-language search, profile feedback and the JD checker. Run: npm run test:unit
import assert from "node:assert/strict";
import { explainMatch } from "../src/lib/matching";
import { parseNaturalQuery } from "../src/lib/nlsearch";
import { checkJobDescription } from "../src/lib/jdcheck";
import { profileFeedback } from "../src/lib/feedback";
import { publicOrigin } from "../src/lib/origin";
import { MIGRATIONS } from "../src/lib/migrations.generated";
import { cdata, cleanSource, shareLinks, slugProblem, xmlEscape } from "../src/lib/distribution-utils";
import { cleanTag } from "../src/lib/tags";
import { fakeVerify, hashPassword, passwordProblem, verifyPassword } from "../src/lib/password";

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
t("embedded migrations: every statement splits cleanly, ordered, no stray semicolons", () => {
  const split = (sql: string) => sql.split("\n").filter((l) => !l.trim().startsWith("--")).join("\n").split(/;\s*(?:\n|$)/).map((x) => x.trim()).filter(Boolean);
  assert.ok(MIGRATIONS.length >= 15); assert.deepEqual(MIGRATIONS.map((m) => m.name), [...MIGRATIONS.map((m) => m.name)].sort());
  for (const m of MIGRATIONS) { const stmts = split(m.sql); assert.ok(stmts.length > 0, m.name); for (const st of stmts) assert.ok(!st.includes(";"), `${m.name}: statement contains ;`); assert.match(m.checksum, /^[a-f0-9]{64}$/); }
});
const asyncTests: Promise<void>[] = [];
const ta = (name: string, fn: () => Promise<void>) => { asyncTests.push(fn().then(() => { n++; console.log("PASS " + name); })); };
ta("password hashes verify, differ per salt, and wrong or malformed ones fail", async () => {
  const h1 = await hashPassword("correct horse battery"), h2 = await hashPassword("correct horse battery");
  assert.notEqual(h1, h2); assert.ok(h1.startsWith("scrypt$32768$8$1$"));
  assert.equal(await verifyPassword("correct horse battery", h1), true); assert.equal(await verifyPassword("correct horse batterY", h1), false);
  assert.equal(await verifyPassword("x", "garbage"), false); assert.equal(await verifyPassword("x", "scrypt$1$1$1$zz$zz"), false);
  await fakeVerify("anything");
});
t("password rules: length, common passwords, own email name", () => {
  const c = { email: "sajeed.khan@example.com", name: "Sajeed Khan" };
  assert.ok(passwordProblem("short", c)); assert.ok(passwordProblem("password123", c)); assert.ok(passwordProblem("aaaaaaaaaaaa", c)); assert.ok(passwordProblem("my-sajeed.khan-pass", c));
  assert.ok(passwordProblem("x".repeat(129), c)); assert.equal(passwordProblem("blue river walks home", c), null);
});
t("career-page addresses are validated and reserved words refused", () => {
  assert.equal(slugProblem("acme-labs"), null);
  for (const bad of ["ab", "-acme", "Acme", "acme_labs", "a--b", "acme-", "admin", "api", "x".repeat(41)]) assert.ok(slugProblem(bad), bad);
});
t("source tags accept only a safe allow-list", () => {
  assert.equal(cleanSource("LinkedIn"), "linkedin"); assert.equal(cleanSource("wa-1_x"), "wa-1_x");
  for (const bad of ["", "<script>", "a b", "x".repeat(31), undefined, 5]) assert.equal(cleanSource(bad as unknown), null);
});
t("feed text is escaped and CDATA cannot be broken out of", () => {
  assert.equal(xmlEscape(`<a href="x">&'`), "&lt;a href=&quot;x&quot;&gt;&amp;&apos;");
  assert.ok(!cdata("a]]><evil/>").slice(9, -3).includes("]]><evil"));
  assert.ok(cdata("a]]>b").includes("]]]]><![CDATA[>"));
});
t("share links carry the source tag and encode the title", () => {
  const l = shareLinks("https://x.test/opportunities/1", "Dev & Co");
  assert.ok(l.linkedin.includes(encodeURIComponent("https://x.test/opportunities/1?src=linkedin")));
  assert.ok(l.whatsapp.includes("Dev%20%26%20Co")); assert.ok(l.email.startsWith("mailto:"));
});
t("tags are normalised, capped and stripped of markup characters", () => {
  assert.equal(cleanTag("  Strong   Portfolio "), "strong portfolio"); assert.equal(cleanTag("a,b<c>"), "a b c");
  for (const bad of ["", "x", "y".repeat(31), undefined, 4]) assert.equal(cleanTag(bad as unknown), null);
});
Promise.all(asyncTests).then(() => console.log(`\n${n} unit tests passed`)).catch((e) => { console.error(e); process.exit(1); });
