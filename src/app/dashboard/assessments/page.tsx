import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/session";
import { sandboxConfigured } from "@/lib/sandbox";
import { ActionButton, ActionForm, Area, Field } from "@/components/dash/action-form";
import { Empty, PageTitle, Panel, Status, fmt } from "@/components/dash/ui";
import { closeAssessment, createAssessment } from "@/app/actions/assessments";
import { LANGS } from "@/lib/sandbox";

const sel = "mt-1.5 h-11 w-full rounded-lg border border-line bg-surface px-3 text-[15px]";

export default async function Page() {
  const u = await requirePageRole("STUDENT", "EMPLOYER");
  if (u.role === "STUDENT") {
    const sp = await db.studentProfile.findUniqueOrThrow({ where: { userId: u.id } });
    const open = await db.assessment.findMany({
      where: { closedAt: null, OR: [{ closesAt: null }, { closesAt: { gt: new Date() } }], company: { status: "VERIFIED", members: { none: { user: { suspendedAt: { not: null } } } } }, ...(sandboxConfigured() ? {} : { kind: "WRITTEN" }) },
      orderBy: { createdAt: "desc" }, take: 50, include: { company: true, attempts: { where: { studentId: sp.id }, orderBy: { createdAt: "desc" }, take: 1 } },
    });
    return (
      <>
        <PageTitle title="Assessments" sub="Practical tasks from verified employers. Results are one piece of evidence, never a verdict on your ability." />
        {!sandboxConfigured() && <p className="mb-4 rounded-lg border border-dashed border-line p-3 text-sm text-ink-soft">Coding assessments are switched off until a secure code runner is connected. Written assessments are available.</p>}
        <Panel>{open.length ? <ul className="divide-y divide-line">{open.map((a) => (
          <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div><Link className="font-semibold underline" href={`/dashboard/assessments/${a.id}`}>{a.title}</Link><p className="text-sm text-ink-soft">{a.company.name} · {a.kind === "CODING" ? "Coding" : "Written"}{a.closesAt && ` · closes ${fmt(a.closesAt)}`}</p></div>
            {a.attempts[0] ? <Status s={a.attempts[0].status} /> : <span className="text-sm text-ink-soft">Not started</span>}
          </li>))}</ul> : <Empty>No open assessments right now.</Empty>}</Panel>
      </>
    );
  }
  const mem = await db.employerMember.findUnique({ where: { userId: u.id }, include: { company: true } });
  if (!mem || mem.company.status !== "VERIFIED") return (<><PageTitle title="Assessments" /><Panel><Empty>Your company must be verified to create assessments.</Empty></Panel></>);
  const mine = await db.assessment.findMany({ where: { companyId: mem.companyId }, orderBy: { createdAt: "desc" }, include: { _count: { select: { attempts: true } } } });
  return (
    <>
      <PageTitle title="Assessments" sub="Coding tests run in an isolated sandbox. Written tasks are scored by your reviewers. Neither replaces a human hiring decision." />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <Panel title="Your assessments">{mine.length ? <ul className="divide-y divide-line">{mine.map((a) => (
          <li key={a.id} className="py-3"><div className="flex flex-wrap items-center justify-between gap-2"><Link className="font-semibold underline" href={`/dashboard/assessments/${a.id}`}>{a.title}</Link>{a.closedAt ? <Status s="REJECTED" /> : <ActionButton variant="ghost" confirm="Close this assessment to new attempts?" action={closeAssessment.bind(null, a.id)}>Close</ActionButton>}</div>
            <p className="text-sm text-ink-soft">{a.kind === "CODING" ? "Coding" : "Written"} · {a._count.attempts} attempt{a._count.attempts === 1 ? "" : "s"}{a.closedAt && " · closed"}</p></li>))}</ul> : <Empty>No assessments yet.</Empty>}</Panel>
        <Panel title="Create an assessment">
          <ActionForm action={createAssessment} reset submit="Publish assessment" success="Published" className="space-y-4">
            <label className="block text-sm font-semibold">Type<select name="kind" className={sel}><option value="WRITTEN">Written (reviewer scores each answer)</option>{sandboxConfigured() && <option value="CODING">Coding (auto-tested in a sandbox)</option>}</select></label>
            <Field label="Title" name="title" required />
            <Area label="Instructions" name="instructions" required maxLength={4000} />
            <Area label="Questions or tests" name="items" required maxLength={6000} placeholder={"Written: one per line, e.g.\nHow would you reduce churn for a student app? | 20\n\nCoding: tests separated by ###, input and expected output split by a line with =>"} hint="Written: Question | max points. Coding: input, a line with =>, expected output; separate tests with ###; start a test with [hidden] to hide it from candidates." />
            {sandboxConfigured() && <fieldset className="text-sm"><legend className="font-semibold">Languages (coding)</legend><div className="mt-1 flex flex-wrap gap-4">{Object.entries(LANGS).map(([k, v]) => <label key={k} className="flex items-center gap-2"><input type="checkbox" name="languages" value={k} className="h-4 w-4 accent-neon" />{v.label}</label>)}</div></fieldset>}
            <div className="grid gap-4 sm:grid-cols-2"><Field label="CPU time limit per test (ms)" name="timeLimitMs" type="number" defaultValue={2000} min={500} max={10000} /><Field label="Memory limit (MB)" name="memoryMb" type="number" defaultValue={128} min={32} max={512} /></div>
            <Field label="Closes on (optional)" name="closesAt" type="date" />
          </ActionForm>
        </Panel>
      </div>
    </>
  );
}
