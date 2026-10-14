import { db } from "@/lib/db";
import { asList } from "@/lib/lists";
import { requirePageRole } from "@/lib/session";
import { Empty, PageTitle, Panel, Stat } from "@/components/dash/ui";
import { TYPE_LABEL } from "@/lib/opportunity-types";

const WEEK = 7 * 864e5;
const wk = (d: Date, now: number) => Math.min(7, Math.floor((now - d.getTime()) / WEEK)); // 0 = this week ... 7 = 8 weeks ago

function Weekly({ title, rows }: { title: string; rows: number[] }) {
  const max = Math.max(1, ...rows);
  return (
    <Panel title={title}><ul className="space-y-2 text-sm">{rows.map((n, i) => (
      <li key={i} className="grid grid-cols-[100px_1fr_36px] items-center gap-3"><span className="text-ink-soft">{i === 0 ? "This week" : `${i} wk ago`}</span><span className="h-3 rounded bg-muted" role="img" aria-label={`${n}`}><span className="block h-3 rounded bg-primary" style={{ width: `${(n / max) * 100}%` }} /></span><b className="text-right">{n}</b></li>))}</ul></Panel>
  );
}

export default async function Page() {
  await requirePageRole("PLATFORM_ADMIN");
  const now = Date.now(), since = new Date(now - 8 * WEEK);
  const [users, apps, posts, open, claimed, stages, oppTypes, hired, offers, submissions, attempts, drives] = await Promise.all([
    db.user.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true, role: true } }),
    db.application.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
    db.post.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
    db.opportunity.findMany({ where: { moderated: "VERIFIED", closedAt: null, deadline: { gt: new Date() } }, select: { skills: true } }),
    db.studentProfile.findMany({ select: { skillsClaimed: true }, take: 3000 }),
    db.application.groupBy({ by: ["stage"], _count: true }),
    db.opportunity.groupBy({ by: ["type"], where: { moderated: "VERIFIED" }, _count: true }),
    db.application.count({ where: { stage: "HIRED" } }),
    db.offer.groupBy({ by: ["status"], _count: true }),
    db.submission.count(), db.assessmentAttempt.count(), db.drive.count({ where: { status: "CONFIRMED" } }),
  ]);
  const bucket = (ds: Date[]) => { const r = Array(8).fill(0); ds.forEach((d) => r[wk(d, now)]++); return r as number[]; };
  const top = (lists: string[][]) => { const m = new Map<string, number>(); lists.flat().forEach((s) => m.set(s.toLowerCase(), (m.get(s.toLowerCase()) ?? 0) + 1)); return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10); };
  const wanted = top(open.map((o) => asList(o.skills))), have = top(claimed.map((c) => asList(c.skillsClaimed)));
  const offerCount = (s: string) => offers.find((o) => o.status === s)?._count ?? 0;
  return (
    <>
      <PageTitle title="Platform insights" sub="Real counts from the database. Nothing is estimated, and no personal data is shown." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Hires recorded" value={hired} /><Stat label="Offers extended" value={offers.reduce((n, o) => n + o._count, 0)} /><Stat label="Offers accepted" value={offerCount("ACCEPTED")} />
        <Stat label="Challenge submissions" value={submissions} /><Stat label="Assessment attempts" value={attempts} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Weekly title="New accounts per week" rows={bucket(users.map((u) => u.createdAt))} />
        <Weekly title="Applications per week" rows={bucket(apps.map((a) => a.createdAt))} />
        <Weekly title="Community posts per week" rows={bucket(posts.map((p) => p.createdAt))} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Skills employers ask for (open listings)">{wanted.length ? <ol className="space-y-1 text-sm">{wanted.map(([s, n]) => <li key={s} className="flex justify-between"><span>{s}</span><b>{n}</b></li>)}</ol> : <Empty>No open listings name skills yet.</Empty>}</Panel>
        <Panel title="Skills students list (self-declared)">{have.length ? <ol className="space-y-1 text-sm">{have.map(([s, n]) => <li key={s} className="flex justify-between"><span>{s}</span><b>{n}</b></li>)}</ol> : <Empty>No skills listed yet.</Empty>}<p className="mt-3 text-xs text-ink-soft">Comparing the two lists shows where demand and supply differ. Self-declared skills are not verified.</p></Panel>
        <Panel title="Applications by stage">{stages.length ? <ul className="space-y-1 text-sm">{stages.map((s) => <li key={s.stage} className="flex justify-between"><span>{s.stage.replace("_", " ").toLowerCase()}</span><b>{s._count}</b></li>)}</ul> : <Empty>No applications yet.</Empty>}</Panel>
        <Panel title="Live listings by type">{oppTypes.length ? <ul className="space-y-1 text-sm">{oppTypes.map((s) => <li key={s.type} className="flex justify-between"><span>{TYPE_LABEL[s.type]}</span><b>{s._count}</b></li>)}</ul> : <Empty>No listings yet.</Empty>}<p className="mt-3 text-xs text-ink-soft">Confirmed campus drives: {drives}.</p></Panel>
      </div>
    </>
  );
}
