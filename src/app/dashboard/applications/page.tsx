import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/session";
import { ActionButton } from "@/components/dash/action-form";
import { Empty, PageTitle, Panel, Status, fmt } from "@/components/dash/ui";
import { withdrawApplication } from "@/app/actions/student";
import { Thread } from "@/components/dash/thread";

export default async function Page() {
  const u = await requirePageRole("STUDENT");
  const p = await db.studentProfile.findUniqueOrThrow({ where: { userId: u.id } });
  const apps = await db.application.findMany({ where: { studentId: p.id }, orderBy: { createdAt: "desc" }, include: { opportunity: { include: { company: true } }, messages: { orderBy: { createdAt: "asc" }, include: { sender: true } } } });
  return (
    <>
      <PageTitle title="Application tracker" sub="Applied → Shortlisted → Interview → Offer. Outcomes are never guaranteed." />
      {apps.length ? <div className="space-y-4">{apps.map((a) => (
        <Panel key={a.id}>
          <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-display text-lg font-bold">{a.opportunity.title}</p><p className="text-sm text-ink-soft">{a.opportunity.company.name} · applied {fmt(a.createdAt)}</p></div>
            <div className="flex items-center gap-3"><Status s={a.stage} />{["APPLIED", "SHORTLISTED", "INTERVIEW"].includes(a.stage) && <ActionButton variant="ghost" confirm="Withdraw this application?" action={withdrawApplication.bind(null, a.id)}>Withdraw</ActionButton>}</div></div>
          {(a.messages.length > 0 || a.stage !== "APPLIED") && a.stage !== "WITHDRAWN" && <Thread applicationId={a.id} me={u.id} messages={a.messages.map((m) => ({ id: m.id, body: m.body, mine: m.senderId === u.id, who: m.sender.name, at: m.createdAt.toISOString() }))} />}
        </Panel>))}</div> : <Empty>No applications yet.</Empty>}
    </>
  );
}
