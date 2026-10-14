"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireActionRole } from "@/lib/session";
import { assessmentSchema, attemptSchema, parseRubric, parseTests, writtenAttemptSchema, writtenReviewSchema, type TestCase } from "@/lib/validation";
import { LANG_KEYS, runInSandbox, sameOutput, sandboxConfigured, type LangKey } from "@/lib/sandbox";
import { rateLimit } from "@/lib/rate-limit";
import { limitError } from "@/lib/plans";
import { notify } from "@/lib/audit";
import { fail, obj, type Result } from "./_shared";

export type TestOutcome = { index: number; hidden: boolean; passed: boolean; outcome: string; timeMs: number; input?: string; expected?: string; got?: string; error?: string };
export type RunState = Result & { results?: TestOutcome[]; passed?: number; total?: number; saved?: boolean };

async function verifiedCompany() {
  const u = await requireActionRole("EMPLOYER");
  const mem = await db.employerMember.findUnique({ where: { userId: u.id }, include: { company: true } });
  if (!mem || mem.company.status !== "VERIFIED") throw new Error("Your company must be verified before you can do this.");
  return { u, company: mem.company };
}

export async function createAssessment(_: Result, fd: FormData): Promise<Result> {
  const { company } = await verifiedCompany();
  const r = assessmentSchema.safeParse(obj(fd));
  if (!r.success) return fail(r.error);
  const d = r.data;
  const cap = await limitError(company.id, company.plan, "assessments");
  if (cap) return { error: cap };
  let items: unknown, languages: string[] | null = null;
  if (d.kind === "CODING") {
    if (!sandboxConfigured()) return { error: "Coding assessments need a code execution service, which isn't enabled on this platform yet. You can still create written assessments." };
    const tests = parseTests(d.items);
    if (typeof tests === "string") return { error: tests, fieldErrors: { items: tests } };
    items = tests;
    languages = fd.getAll("languages").map(String).filter((l): l is LangKey => (LANG_KEYS as string[]).includes(l));
    if (!languages.length) return { error: "Pick at least one language." };
  } else {
    const qs = parseRubric(d.items.split("\n").map((l) => l.replace(/^\s*\d+[.)]\s*/, "")).join("\n"));
    if (typeof qs === "string") return { error: "Add 2 to 8 questions, one per line: Question | max points (1-100).", fieldErrors: { items: "Use: Question | max points" } };
    items = qs.map((q) => ({ prompt: q.criterion, max: q.max }));
  }
  await db.assessment.create({ data: { companyId: company.id, kind: d.kind, title: d.title, instructions: d.instructions, languages: languages ?? undefined, items: items as object, timeLimitMs: d.timeLimitMs, memoryMb: d.memoryMb, closesAt: d.closesAt ?? null } });
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export async function closeAssessment(id: string) {
  const { company } = await verifiedCompany();
  await db.assessment.updateMany({ where: { id, companyId: company.id, closedAt: null }, data: { closedAt: new Date() } });
  revalidatePath("/dashboard", "layout");
}

async function openAssessment(id: string) {
  const a = await db.assessment.findFirst({ where: { id, kind: "CODING", closedAt: null, company: { status: "VERIFIED", members: { none: { user: { suspendedAt: { not: null } } } } } } });
  if (!a || (a.closesAt && a.closesAt < new Date())) return null;
  return a;
}

async function runTests(a: { timeLimitMs: number; memoryMb: number }, language: LangKey, code: string, tests: TestCase[]) {
  const out: TestOutcome[] = [];
  const unavailable = { error: "" };
  for (let i = 0; i < tests.length; i += 5) {
    const batch = tests.slice(i, i + 5);
    const rs = await Promise.all(batch.map((t) => runInSandbox({ language, code, stdin: t.input, timeLimitMs: a.timeLimitMs, memoryMb: a.memoryMb })));
    rs.forEach((r, j) => {
      const t = batch[j], index = i + j;
      if (!r.ok) { unavailable.error = r.error; out.push({ index, hidden: t.hidden, passed: false, outcome: "SERVICE_ERROR", timeMs: 0 }); return; }
      const passed = r.outcome === "OK" && sameOutput(r.stdout, t.expected);
      out.push({ index, hidden: t.hidden, passed, outcome: r.outcome === "OK" && !passed ? "WRONG_ANSWER" : r.outcome, timeMs: r.timeMs,
        // Hidden tests never reveal input, expected output or the program's output.
        ...(t.hidden ? {} : { input: t.input.trim(), expected: t.expected, got: r.stdout.slice(0, 500), error: r.stderr.slice(0, 500) || undefined }) });
    });
  }
  return { out, serviceError: unavailable.error };
}

function parseAttempt(fd: FormData) {
  const r = attemptSchema.safeParse(obj(fd));
  if (!r.success) return { err: fail(r.error) as Result };
  if (!(LANG_KEYS as string[]).includes(r.data.language)) return { err: { error: "Choose a language." } as Result };
  return { d: { ...r.data, language: r.data.language as LangKey } };
}

/** Runs the visible sample tests only. Nothing is stored. */
export async function runSamples(_: RunState, fd: FormData): Promise<RunState> {
  const u = await requireActionRole("STUDENT");
  const p = parseAttempt(fd); if (!p.d) return p.err;
  const a = await openAssessment(p.d.assessmentId); if (!a) return { error: "This assessment isn't open." };
  if (!sandboxConfigured()) return { error: "Code execution isn't enabled on this platform yet." };
  if (!(a.languages as string[] | null ?? []).includes(p.d.language)) return { error: "That language isn't allowed here." };
  if (!(await rateLimit(`assess-run:${u.id}`, 40, 60 * 60 * 1000))) return { error: "You've run the samples a lot. Try again in a while." };
  const visible = (a.items as TestCase[]).filter((t) => !t.hidden);
  const { out, serviceError } = await runTests(a, p.d.language, p.d.code, visible);
  if (serviceError) return { error: serviceError };
  return { ok: true, results: out, passed: out.filter((x) => x.passed).length, total: out.length };
}

/** Runs every test (hidden ones too), stores the attempt in the candidate's history. */
export async function submitAttempt(_: RunState, fd: FormData): Promise<RunState> {
  const u = await requireActionRole("STUDENT");
  const sp = await db.studentProfile.findUnique({ where: { userId: u.id } });
  if (!sp?.headline) return { error: "Complete your profile before submitting." };
  const p = parseAttempt(fd); if (!p.d) return p.err;
  const a = await openAssessment(p.d.assessmentId); if (!a) return { error: "This assessment isn't open." };
  if (!sandboxConfigured()) return { error: "Code execution isn't enabled on this platform yet." };
  if (!(a.languages as string[] | null ?? []).includes(p.d.language)) return { error: "That language isn't allowed here." };
  if (!(await rateLimit(`assess-submit:${u.id}:${a.id}`, 10, 60 * 60 * 1000))) return { error: "Too many submissions for this assessment this hour." };
  const tests = a.items as TestCase[];
  const { out, serviceError } = await runTests(a, p.d.language, p.d.code, tests);
  if (serviceError) return { error: serviceError }; // a platform failure is never recorded against the candidate
  const passed = out.filter((x) => x.passed).length;
  const allErr = out.every((x) => ["COMPILE_ERROR", "RUNTIME_ERROR", "TIME_LIMIT", "MEMORY_LIMIT"].includes(x.outcome));
  await db.assessmentAttempt.create({ data: { assessmentId: a.id, studentId: sp.id, language: p.d.language, code: p.d.code, status: passed === tests.length ? "PASSED" : allErr ? "ERROR" : "FAILED", results: out as object[], passed, total: tests.length } });
  revalidatePath("/dashboard", "layout");
  return { ok: true, saved: true, results: out.map((x) => (x.hidden ? { index: x.index, hidden: true, passed: x.passed, outcome: x.outcome, timeMs: x.timeMs } : x)), passed, total: tests.length };
}

export async function submitWritten(_: Result, fd: FormData): Promise<Result> {
  const u = await requireActionRole("STUDENT");
  const sp = await db.studentProfile.findUnique({ where: { userId: u.id } });
  if (!sp?.headline) return { error: "Complete your profile before submitting." };
  const r = writtenAttemptSchema.safeParse(obj(fd));
  if (!r.success) return fail(r.error);
  const a = await db.assessment.findFirst({ where: { id: r.data.assessmentId, kind: "WRITTEN", closedAt: null, company: { status: "VERIFIED", members: { none: { user: { suspendedAt: { not: null } } } } } }, include: { company: { include: { members: true } } } });
  if (!a || (a.closesAt && a.closesAt < new Date())) return { error: "This assessment isn't open." };
  if (await db.assessmentAttempt.findFirst({ where: { assessmentId: a.id, studentId: sp.id } })) return { error: "You've already submitted this assessment." };
  const qs = a.items as { prompt: string; max: number }[];
  const raw = obj(fd);
  const answers = qs.map((q, i) => ({ prompt: q.prompt, answer: String(raw[`a${i}`] ?? "").trim().slice(0, 3000) }));
  if (answers.some((x) => x.answer.length < 3)) return { error: "Answer every question." };
  await db.assessmentAttempt.create({ data: { assessmentId: a.id, studentId: sp.id, answers, status: "PENDING_REVIEW" } });
  await Promise.all(a.company.members.map((m) => notify(m.userId, "New assessment submission", `${u.name} submitted ${a.title}`)));
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export async function reviewWritten(_: Result, fd: FormData): Promise<Result> {
  const { company } = await verifiedCompany();
  const r = writtenReviewSchema.safeParse(obj(fd));
  if (!r.success) return fail(r.error);
  const at = await db.assessmentAttempt.findFirst({ where: { id: r.data.attemptId, assessment: { companyId: company.id, kind: "WRITTEN" } }, include: { assessment: true, student: true } });
  if (!at) return { error: "Not found." };
  const qs = at.assessment.items as { prompt: string; max: number }[];
  const raw = obj(fd);
  const scores: { prompt: string; points: number; comment: string }[] = [];
  for (let i = 0; i < qs.length; i++) {
    const pts = Number(raw[`p${i}`]);
    if (!Number.isInteger(pts) || pts < 0 || pts > qs[i].max) return { error: `Question ${i + 1}: enter whole points from 0 to ${qs[i].max}.` };
    scores.push({ prompt: qs[i].prompt, points: pts, comment: String(raw[`c${i}`] ?? "").slice(0, 300) });
  }
  const total = scores.reduce((n, x) => n + x.points, 0), max = qs.reduce((n, x) => n + x.max, 0);
  await db.assessmentAttempt.update({ where: { id: at.id }, data: { scores, passed: total, total: max, feedback: r.data.feedback, status: "REVIEWED", reviewedAt: new Date() } });
  await notify(at.student.userId, "Your assessment was reviewed", `${at.assessment.title}: ${total}/${max}. Open Assessments for feedback.`);
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}
