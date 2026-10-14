import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/session";
import { ActionButton } from "@/components/dash/action-form";
import { Empty, PageTitle, Panel, Status, fmt } from "@/components/dash/ui";
import { withdrawSubmission } from "@/app/actions/student";

export default async function Page() {
  const u = await requirePageRole("STUDENT");
  const p = await db.studentProfile.findUniqueOrThrow({ where: { userId: u.id } });
  const items = await db.submission.findMany({ where: { studentId: p.id }, orderBy: { createdAt: "desc" }, include: { challenge: { include: { opportunity: { include: { company: true } } } } } });
  return (
    <>
      <PageTitle title="Challenge submissions" sub="Scores come from a human reviewer against the published rubric. They inform a decision; they don't define your ability." />
      {items.length ? <div className="space-y-4">{items.map((s) => {
        const scores = (s.scores as { criterion: string; points: number; comment: string }[] | null) ?? [];
        const rubric = s.challenge.rubric as { criterion: string; max: number }[];
        return (
          <Panel key={s.id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><p className="font-display text-lg font-bold">{s.title}</p><p className="text-sm text-ink-soft"><Link className="underline" href={`/challenges/${s.challenge.opportunityId}`}>{s.challenge.opportunity.title}</Link> · {s.challenge.opportunity.company.name} · {fmt(s.createdAt)}</p></div>
              <div className="flex items-center gap-3">{s.totalScore !== null && <b className="text-sm">{s.totalScore}/{s.maxScore}</b>}<Status s={s.status} />{s.status === "SUBMITTED" && <ActionButton variant="ghost" confirm="Withdraw this submission?" action={withdrawSubmission.bind(null, s.id)}>Withdraw</ActionButton>}</div>
            </div>
            {scores.length > 0 && <ul className="mt-3 space-y-1 text-sm">{scores.map((x, i) => <li key={x.criterion}><b>{x.criterion}:</b> {x.points}/{rubric[i]?.max}{x.comment && <span className="text-ink-soft"> · {x.comment}</span>}</li>)}</ul>}
            {s.feedback && <blockquote className="mt-3 rounded-lg border-l-2 border-accent bg-muted p-3 text-sm">{s.feedback}</blockquote>}
            {s.status === "SHORTLISTED" && <p className="mt-3 text-sm text-ink-soft">You were shortlisted. Track next steps under Applications.</p>}
          </Panel>);
      })}</div> : <Empty>No submissions yet. <Link className="underline" href="/challenges">Browse challenges</Link>.</Empty>}
    </>
  );
}
