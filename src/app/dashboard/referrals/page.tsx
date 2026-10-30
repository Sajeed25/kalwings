import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/session";
import { Empty, PageTitle, Panel, Stat } from "@/components/dash/ui";

/** What happened when this student shared listings. Counts only: the friends' names are never shown, and sharing never changes how anyone is assessed. */
export default async function Page() {
  const u = await requirePageRole("STUDENT");
  const p = await db.studentProfile.findUniqueOrThrow({ where: { userId: u.id } });
  const apps = await db.application.findMany({ where: { referrerId: p.id }, select: { id: true, stage: true, opportunity: { select: { id: true, title: true, company: { select: { name: true } } } } } });
  const by = new Map<string, { title: string; company: string; id: string; n: number }>();
  for (const a of apps) { const k = a.opportunity.id; const e = by.get(k) ?? { title: a.opportunity.title, company: a.opportunity.company.name, id: k, n: 0 }; e.n++; by.set(k, e); }
  const shortlisted = apps.filter((a) => ["SHORTLISTED", "INTERVIEW", "OFFER", "HIRED"].includes(a.stage)).length;
  return (
    <>
      <PageTitle title="Sharing impact" sub="When you share a listing from its page, the link carries your name as the referrer. This is how many friends applied through your links. Names stay private, and a referral never changes how anyone is judged." />
      <div className="grid gap-4 sm:grid-cols-3"><Stat label="Friends who applied" value={apps.length} tone="mint" /><Stat label="Listings they applied to" value={by.size} tone="lilac" /><Stat label="Moved forward by employers" value={shortlisted} tone="sun" /></div>
      <Panel title="By listing" className="mt-6">
        {by.size ? <ul className="divide-y divide-line">{[...by.values()].sort((a, b) => b.n - a.n).map((l) => <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><Link href={`/opportunities/${l.id}`} className="font-semibold hover:underline">{l.title} <span className="font-normal text-ink-soft">· {l.company}</span></Link><span className="text-sm">{l.n} applied</span></li>)}</ul>
          : <Empty>No one has applied through your links yet. Open any listing and use “Share on WhatsApp”.</Empty>}
        <p className="mt-4 text-sm"><Link href="/opportunities" className="font-semibold text-accent underline">Find something to share →</Link></p>
      </Panel>
    </>
  );
}
