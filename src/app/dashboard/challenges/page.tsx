import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/session";
import { ActionForm, Area, Field } from "@/components/dash/action-form";
import { Empty, PageTitle, Panel, Status, fmt } from "@/components/dash/ui";
import { createChallenge } from "@/app/actions/employer";
import { KIND_LABEL, STYLE_HELP, STYLE_LABEL } from "@/lib/challenge-labels";

const sel = "mt-1.5 h-11 w-full rounded-lg border border-line bg-surface px-3 text-[15px]";

export default async function Page() {
  const u = await requirePageRole("EMPLOYER");
  const mem = await db.employerMember.findUnique({ where: { userId: u.id }, include: { company: true } });
  if (!mem || mem.company.status !== "VERIFIED") return (<><PageTitle title="Challenges" /><Panel><Empty>Your company must be verified to run challenges.</Empty></Panel></>);
  const items = await db.challenge.findMany({ where: { opportunity: { companyId: mem.companyId } }, orderBy: { createdAt: "desc" }, include: { opportunity: true, _count: { select: { submissions: true } } } });
  return (
    <>
      <PageTitle title="Challenges" sub="Publish a real problem with a scoring rubric. People submit work, you review it, and strong candidates flow into your pipeline." />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <Panel title="Your challenges">
          {items.length ? <ul className="divide-y divide-line">{items.map((c) => (
            <li key={c.id} className="py-3">
              <div className="flex flex-wrap items-center justify-between gap-2"><Link className="font-semibold underline" href={`/dashboard/challenges/${c.id}`}>{c.opportunity.title}</Link><Status s={c.opportunity.moderated} /></div>
              <p className="text-sm text-ink-soft">{KIND_LABEL[c.kind]} · {STYLE_LABEL[c.style]} · {c._count.submissions} submission{c._count.submissions === 1 ? "" : "s"} · closes {fmt(c.opportunity.deadline)}</p>
            </li>))}</ul> : <Empty>No challenges yet.</Empty>}
        </Panel>
        <Panel title="Create a challenge">
          <ActionForm action={createChallenge} reset submit="Submit for moderation" success="Submitted. It goes live after review." className="space-y-4">
            <Field label="Title" name="title" required />
            <Area label="Public summary" name="description" required maxLength={600} hint="Two or three sentences. Shown in listings." />
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold">Type of work<select name="kind" className={sel}>{Object.entries(KIND_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
              <label className="block text-sm font-semibold">Style<select name="style" className={sel}>{Object.entries(STYLE_LABEL).map(([k, l]) => <option key={k} value={k}>{l}: {STYLE_HELP[k as keyof typeof STYLE_HELP]}</option>)}</select></label>
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="allowTeams" value="true" className="h-4 w-4 accent-neon" />Allow team submissions</label>
            <Area label="Brief" name="brief" required maxLength={5000} hint="The problem, deliverables, constraints and anything candidates may use." />
            <Area label="Scoring rubric" name="rubric" required maxLength={1200} placeholder={"Correctness | 40 | Solves the stated problem\nCode quality | 30 | Readable, tested\nCommunication | 30 | Clear write-up"} hint="One criterion per line: Criterion | max points | what good looks like. 2 to 8 lines." />
            <Field label="Skill a reviewer may award (optional)" name="skillTag" maxLength={60} hint="Shown on the candidate's Passport as evidence-backed, only if you tick it when reviewing." />
            <div className="grid gap-4 sm:grid-cols-2"><Field label="Reward" name="payText" required placeholder="₹25,000 prize pool, or Unpaid, certificate only" /><label className="flex items-end gap-2 pb-3 text-sm"><input type="checkbox" name="unpaid" value="true" className="h-4 w-4 accent-neon" />Unpaid</label></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold">Work mode<select name="workMode" className={sel}><option value="REMOTE">Remote</option><option value="HYBRID">Hybrid</option><option value="ONSITE">On-site</option></select></label>
              <Field label="Location" name="location" required placeholder="City or Pan-India" />
            </div>
            <Field label="Eligibility" name="eligibility" required placeholder="Final-year and recent graduates" />
            <Field label="Submission deadline" name="deadline" type="date" required />
          </ActionForm>
        </Panel>
      </div>
    </>
  );
}
