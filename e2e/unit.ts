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
import { normaliseIdentifier } from "../src/lib/identifier";
import { sniffResume, sniffVideo, safeFileName, MAX_RESUME_BYTES } from "../src/lib/files";
import { safeNext } from "../src/lib/next-path";
import { buildIcs, googleCalendarUrl, mapsUrl } from "../src/lib/calendar";
import { learningLinks } from "../src/lib/learn";
import { githubUsername, summariseRepos } from "../src/lib/github-parse";
import { alertMatches } from "../src/lib/alerts-match";
import { parsePin, validPin } from "../src/lib/pincode";
import { TESTS, forTaking, grade } from "../src/lib/practice-bank";
import { parseSubscription, pushPayload } from "../src/lib/push-parse";
import { LANGS, isLang, tr } from "../src/lib/i18n";
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
t("sign-in is email only: mobile numbers are refused unless MOBILE_LOGIN is on", () => {
  delete process.env.MOBILE_LOGIN;
  assert.deepEqual(normaliseIdentifier(" Me@Example.COM "), { kind: "email", value: "me@example.com" });
  for (const phone of ["9876543210", "+919876543210", "98765 43210"]) assert.equal(normaliseIdentifier(phone), null);
  process.env.MOBILE_LOGIN = "true";
  assert.deepEqual(normaliseIdentifier("9876543210"), { kind: "phone", value: "+919876543210" });
  delete process.env.MOBILE_LOGIN;
});

// ---- resumes, intro videos and safe return links ----
const pad = (head: Buffer, n = 200) => Buffer.concat([head, Buffer.alloc(n, 0x20)]);
t("resumes: PDF, DOC, DOCX and RTF are recognised by content, whatever the file is called", () => {
  assert.equal(sniffResume(pad(Buffer.from("%PDF-1.7\n")))?.ext, "pdf");
  assert.equal(sniffResume(pad(Buffer.from("{\\rtf1\\ansi ")))?.ext, "rtf");
  assert.equal(sniffResume(pad(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])))?.ext, "doc");
  assert.equal(sniffResume(pad(Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.from("word/document.xml")])))?.ext, "docx");
});
t("resumes: macros, embedded objects, scripts, other zips, images and tiny files are refused", () => {
  assert.equal(sniffResume(pad(Buffer.from("%PDF-1.7 /JavaScript (app.alert(1))"))), null);
  assert.equal(sniffResume(pad(Buffer.from("%PDF-1.7 /Launch"))), null);
  assert.equal(sniffResume(pad(Buffer.from("{\\rtf1 \\objdata 0105"))), null);
  assert.equal(sniffResume(pad(Buffer.concat([Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]), Buffer.from("VBA", "utf16le")]))), null);
  assert.equal(sniffResume(pad(Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.from("word/document.xml word/vbaProject.bin")]))), null);
  assert.equal(sniffResume(pad(Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.from("xl/workbook.xml")]))), null); // an Excel file
  assert.equal(sniffResume(pad(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))), null);
  assert.equal(sniffResume(Buffer.from("%PDF-")), null);
  assert.equal(MAX_RESUME_BYTES, 2_000_000);
});
t("intro videos: WebM and MP4 recordings are recognised, other files are not", () => {
  assert.equal(sniffVideo(pad(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]), 2000)), "video/webm");
  assert.equal(sniffVideo(pad(Buffer.from([0, 0, 0, 0x20, 0x66, 0x74, 0x79, 0x70]), 2000)), "video/mp4");
  assert.equal(sniffVideo(pad(Buffer.from("%PDF-1.7"), 2000)), null);
  assert.equal(sniffVideo(Buffer.from([0x1a, 0x45, 0xdf, 0xa3])), null);
});
t("download names are safe and always end in the real extension", () => {
  assert.equal(safeFileName("../../My Résumé (final).docx", "pdf"), "My Rsum (final).pdf");
  assert.equal(safeFileName("", "pdf"), "resume.pdf");
  assert.equal(safeFileName('a"b\r\nc.rtf', "rtf"), "abc.rtf");
});
t("return links: only same-site paths on the allow-list survive", () => {
  assert.equal(safeNext("/opportunities/abc123?src=whatsapp&ref=x1"), "/opportunities/abc123?src=whatsapp&ref=x1");
  for (const ok of ["/challenges/xyz", "/j/ab12cd34", "/jobs-in/hyderabad", "/dashboard/resume", "/dashboard"]) assert.equal(safeNext(ok), ok);
  for (const bad of ["https://evil.example", "//evil.example", "/\\evil.example", "javascript:alert(1)", "/api/auth/google", "/login", "", "opportunities/x", "/opportunities/\nx", "/dashboardx".padEnd(400, "a")]) assert.equal(safeNext(bad), null, String(bad).slice(0, 30));
  assert.equal(safeNext(undefined), null);
});

// ---- calendar, learning links, GitHub signal, alerts ----
t("calendar files: all-day deadlines and timed events, with escaping and line folding", () => {
  const ics = buildIcs({ uid: "x1", title: "Closing: React, Intern; Acme", start: new Date("2026-11-20T00:00:00Z"), allDay: true, location: "Hyderabad", description: "Line1\nLine2", url: "https://app.kalwings.com/j/abc" });
  assert.ok(ics.startsWith("BEGIN:VCALENDAR\r\n") && ics.endsWith("END:VCALENDAR\r\n"));
  assert.ok(ics.includes("DTSTART;VALUE=DATE:20261120") && ics.includes("DTEND;VALUE=DATE:20261121"));
  assert.ok(ics.includes("SUMMARY:Closing: React\\, Intern\\; Acme") && ics.includes("DESCRIPTION:Line1\\nLine2"));
  const timed = buildIcs({ uid: "x2", title: "Webinar", start: new Date("2026-11-20T10:00:00Z"), end: new Date("2026-11-20T11:30:00Z") });
  assert.ok(timed.includes("DTSTART:20261120T100000Z") && timed.includes("DTEND:20261120T113000Z"));
  assert.ok(buildIcs({ uid: "x3", title: "T".repeat(300), start: new Date() }).split("\r\n").every((l) => l.length <= 75));
  const g = googleCalendarUrl({ uid: "x", title: "Webinar & Q&A", start: new Date("2026-11-20T10:00:00Z") });
  assert.ok(g.startsWith("https://calendar.google.com/calendar/render?action=TEMPLATE") && g.includes("dates=20261120T100000Z%2F20261120T110000Z") && g.includes("Webinar+%26+Q%26A"));
  assert.equal(mapsUrl("Hitech City, Hyderabad"), "https://www.google.com/maps/search/?api=1&query=Hitech%20City%2C%20Hyderabad");
});
t("free learning links: known skills get curated sources, unknown skills get none unless asked", () => {
  assert.ok(learningLinks("Python")[0].url.startsWith("https://"));
  assert.ok(learningLinks("react").some((r) => r.url.includes("react.dev")));
  assert.equal(learningLinks("Underwater basket weaving").length, 0);
  assert.ok(learningLinks("Underwater basket weaving", true).length >= 2);
});
t("GitHub: username from profile or repo URLs only; repos, languages and last push are summarised from public data", () => {
  assert.equal(githubUsername("https://github.com/octocat"), "octocat");
  assert.equal(githubUsername("https://www.github.com/octo-cat/hello-world?tab=repositories"), "octo-cat");
  for (const bad of ["https://evil.example/octocat", "https://github.com.evil.example/x", "ftp://github.com/x", "javascript:alert(1)", "https://github.com/", "https://github.com/-bad", "", null]) assert.equal(githubUsername(bad as string), null);
  const s = summariseRepos("octocat", [{ language: "TypeScript", pushed_at: "2026-10-01T00:00:00Z" }, { language: "TypeScript", pushed_at: "2026-10-20T00:00:00Z" }, { language: "Python", pushed_at: "2026-09-01T00:00:00Z" }, { fork: true, language: "Go", pushed_at: "2026-10-25T00:00:00Z" }, { language: null }]);
  assert.deepEqual(s, { user: "octocat", repos: 4, languages: ["TypeScript", "Python"], lastPush: "2026-10-20T00:00:00.000Z" });
  assert.equal(summariseRepos("x", { message: "rate limited" }), null);
});
t("job alerts: need a filter, every filter must match, nothing matches an empty alert", () => {
  const o = { title: "React Developer Intern", type: "INTERNSHIP", workMode: "HYBRID", location: "Hyderabad, Telangana", skills: ["React", "CSS"], company: "Acme Labs" };
  assert.equal(alertMatches({}, o), false); assert.equal(alertMatches({ q: "  " }, o), false);
  assert.equal(alertMatches({ location: "hyderabad" }, o), true); assert.equal(alertMatches({ location: "Chennai" }, o), false);
  assert.equal(alertMatches({ q: "react", type: "INTERNSHIP", mode: "HYBRID", location: "Hyderabad" }, o), true);
  assert.equal(alertMatches({ q: "react", type: "JOB" }, o), false); assert.equal(alertMatches({ q: "acme" }, o), true); assert.equal(alertMatches({ q: "css" }, o), true); assert.equal(alertMatches({ mode: "REMOTE" }, o), false);
});
t("PIN codes: six digits not starting with 0; India Post replies are read defensively", () => {
  for (const ok of ["500081", "110001"]) assert.ok(validPin(ok));
  for (const bad of ["050001", "12345", "1234567", "abcdef", "50008 ", ""]) assert.ok(!validPin(bad));
  assert.deepEqual(parsePin([{ Status: "Success", PostOffice: [{ Name: "Madhapur", District: "Hyderabad", State: "Telangana" }] }]), { district: "Hyderabad", area: "Madhapur", state: "Telangana" });
  for (const bad of [null, [], [{ Status: "Error", PostOffice: null }], [{ Status: "Success", PostOffice: [] }], [{ Status: "Success", PostOffice: [{ Name: "x" }] }], "<script>"]) assert.equal(parsePin(bad), null);
  assert.equal(parsePin([{ Status: "Success", PostOffice: [{ Name: "A", District: "<b>Pune</b>", State: "MH" }] }])?.district, "bPuneb"); // markup characters are stripped, never rendered
});
t("practice tests: every question has one valid answer and a reason; grading is server-side and ignores bad input", () => {
  assert.ok(TESTS.length >= 4 && new Set(TESTS.map((x) => x.slug)).size === TESTS.length);
  for (const x of TESTS) for (const q of x.questions) { assert.ok([0, 1, 2, 3].includes(q.answer) && q.why.length > 10 && new Set(q.options).size === 4); }
  const x = TESTS[0], taking = JSON.stringify(forTaking(x));
  assert.ok(!taking.includes("\"answer\"") && !taking.includes("\"why\""));
  const all = grade(x, x.questions.map((q) => q.answer)); assert.equal(all.score, x.questions.length);
  assert.equal(grade(x, []).score, 0); assert.equal(grade(x, x.questions.map(() => 99 as number)).score, 0);
});
t("push: only https subscriptions with plausible keys; payloads are trimmed and links stay on the site", () => {
  const key = "B" + "x".repeat(86), auth = "y".repeat(22);
  const good = { endpoint: "https://fcm.googleapis.com/fcm/send/abc123def456ghi789", keys: { p256dh: key, auth } };
  assert.ok(parseSubscription(good));
  for (const bad of [null, {}, { ...good, endpoint: "http://fcm.googleapis.com/x/abcdefghijklmn" }, { ...good, endpoint: "https://localhost/abcdefghijklmnop" }, { ...good, keys: { p256dh: "short", auth } }, { ...good, keys: { p256dh: key, auth: "<>" } }]) assert.equal(parseSubscription(bad), null);
  const p = JSON.parse(pushPayload("T".repeat(200), "b".repeat(400), "/opportunities/1"));
  assert.ok(p.title.length <= 80 && p.body.length <= 160 && p.url === "/opportunities/1");
  for (const u of ["//evil.example", "https://evil.example", "javascript:alert(1)", undefined]) assert.equal(JSON.parse(pushPayload("t", "b", u)).url, "/dashboard/notifications");
});
t("languages: Hindi and Telugu cover the same keys as English and unknown languages are refused", () => {
  assert.deepEqual(LANGS.map((l) => l.code), ["en", "hi", "te"]);
  assert.ok(isLang("hi") && !isLang("xx") && !isLang(undefined));
  for (const l of ["hi", "te"] as const) { assert.notEqual(tr(l, "auth.login"), tr("en", "auth.login")); assert.notEqual(tr(l, "nav.events"), "nav.events"); }
});
Promise.all(asyncTests).then(() => console.log(`\n${n} unit tests passed`)).catch((e) => { console.error(e); process.exit(1); });
