import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/session";
import { Empty, PageTitle, Panel, Stat } from "@/components/dash/ui";
import { PIPELINE, stageLabels } from "@/lib/stages";

export default async function Page() {
  const u = await requirePageRole("EMPLOYER");
  const mem = await db.employerMember.findUnique({ where: { userId: u.id }, include: { company: true } });
  if (!mem || mem.company.status !== "VERIFIED") return (<><PageTitle title="Hiring analytics" /><Panel><Empty>Your company must be verified first.</Empty></Panel></>);
  const labels = stageLabels(mem.company.stageLabels);
  const opps = await db.opportunity.findMany({ where: { companyId: mem.companyId }, orderBy: { createdAt: "desc" }, include: { applications: { select: { stage: true, offer: { select: { status: true } }, interviews: { select: { id: true } } } } } });
  const apps = opps.flatMap((o) => o.applications);
  const by = (s: string) => apps.filter((a) => a.stage === s).length;
  const offers = apps.filter((a) => a.offer).length;
  const accepted = apps.filter((a) => a.offer?.status === "ACCEPTED").length;
  const interviewed = apps.filter((a) => a.interviews.length > 0).length;
  const max = Math.max(1, ...PIPELINE.map(by), by("REJECTED"));
  const recent = await db.application.findMany({ where: { opportunity: { companyId: mem.companyId }, createdAt: { gte: new Date(Date.now() - 8 * 7 * 864e5) } }, select: { createdAt: true } });
  const weekly = Array(8).fill(0) as number[]; recent.forEach((a) => { weekly[Math.min(7, Math.floor((Date.now() - a.createdAt.getTime()) / (7 * 864e5)))]++; });
  const wmax = Math.max(1, ...weekly);
  return (
    <>
      <PageTitle title="Hiring analytics" sub="Counts from your real pipeline, as it stands now. Nothing is estimated." />
      {!apps.length ? <Panel><Empty>No applications yet. Numbers appear here once candidates apply.</Empty></Panel> : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Stat label="Applications" value={apps.length} /><Stat label="Interviewed" value={interviewed} /><Stat label="Offers made" value={offers} />
            <Stat label="Offers accepted" value={offers ? `${accepted} of ${offers}` : "—"} /><Stat label="Hired" value={by("HIRED")} />
          </div>
          <Panel title="Where candidates are now">
            <ul className="space-y-3">{[...PIPELINE, "REJECTED" as const].map((s) => (
              <li key={s} className="grid grid-cols-[130px_1fr_40px] items-center gap-3 text-sm"><span>{s === "REJECTED" ? "Rejected" : labels[s]}</span>
                <span className="h-3 rounded bg-muted" role="img" aria-label={`${by(s)} candidates`}><span className="block h-3 rounded bg-neon" style={{ width: `${(by(s) / max) * 100}%` }} /></span><b className="text-right">{by(s)}</b></li>))}</ul>
            <p className="mt-3 text-xs text-ink-soft">Withdrawn applications: {by("WITHDRAWN")}.</p>
          </Panel>
          <Panel title="Applications per week">
            <ul className="space-y-2 text-sm">{weekly.map((n, i) => <li key={i} className="grid grid-cols-[100px_1fr_36px] items-center gap-3"><span className="text-ink-soft">{i === 0 ? "This week" : `${i} wk ago`}</span><span className="h-3 rounded bg-muted" role="img" aria-label={`${n} applications`}><span className="block h-3 rounded bg-neon" style={{ width: `${(n / wmax) * 100}%` }} /></span><b className="text-right">{n}</b></li>)}</ul>
          </Panel>
          <Panel title="By listing">
            <div className="overflow-x-auto" role="region" aria-label="Applications by listing" tabIndex={0}><table className="w-full text-left text-sm"><thead><tr className="text-ink-soft"><th className="py-2 pr-4 font-semibold">Listing</th><th className="pr-4 font-semibold">Applications</th><th className="pr-4 font-semibold">Shortlisted+</th><th className="pr-4 font-semibold">Offers</th><th className="font-semibold">Hired</th></tr></thead>
              <tbody className="divide-y divide-line">{opps.map((o) => (
                <tr key={o.id}><td className="py-2 pr-4">{o.title}</td><td className="pr-4">{o.applications.length}</td><td className="pr-4">{o.applications.filter((a) => ["SHORTLISTED", "INTERVIEW", "OFFER", "HIRED"].includes(a.stage)).length}</td><td className="pr-4">{o.applications.filter((a) => a.offer).length}</td><td>{o.applications.filter((a) => a.stage === "HIRED").length}</td></tr>))}</tbody></table></div>
          </Panel>
        </div>)}
    </>
  );
}
