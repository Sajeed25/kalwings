import { CompanyLogo } from "@/components/ui/company-logo";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/session";
import { ActionButton } from "@/components/dash/action-form";
import { Empty, PageTitle, Panel, Status, fmt, fmtTime } from "@/components/dash/ui";
import { respondOffer, withdrawApplication } from "@/app/actions/student";
import { WITHDRAWABLE } from "@/lib/stages";
import { Thread } from "@/components/dash/thread";

export default async function Page() {
  const u = await requirePageRole("STUDENT");
  const p = await db.studentProfile.findUniqueOrThrow({ where: { userId: u.id } });
  const apps = await db.application.findMany({ where: { studentId: p.id }, orderBy: { createdAt: "desc" }, include: { offer: true, interviews: { where: { status: "SCHEDULED", scheduledAt: { gt: new Date() } }, orderBy: { scheduledAt: "asc" } }, opportunity: { include: { company: true } }, messages: { orderBy: { createdAt: "asc" }, include: { sender: true } } } });
  return (
    <>
      <PageTitle title="Application tracker" sub="Applied → Under review → Shortlisted → Interview → Offer → Hired. Outcomes are never guaranteed." />
      {apps.length ? <div className="space-y-4">{apps.map((a) => (
        <Panel key={a.id}>
          <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-4"><CompanyLogo name={a.opportunity.company.name} logoId={a.opportunity.company.logoId} /><div><p className="font-display text-lg font-bold">{a.opportunity.title}</p><p className="text-sm text-ink-soft">{a.opportunity.company.name} · applied {fmt(a.createdAt)}</p></div></div>
            <div className="flex items-center gap-3"><Status s={a.stage} />{WITHDRAWABLE.includes(a.stage) && <ActionButton variant="ghost" confirm="Withdraw this application?" action={withdrawApplication.bind(null, a.id)}>Withdraw</ActionButton>}</div></div>
          <p className="mt-2 text-xs text-ink-soft">Sent with this application: Talent Card{a.resumeId ? ", resume" : ""}{a.introVideoId ? ", intro video" : ""}.</p>
          {a.interviews.map((i) => <p key={i.id} className="mt-3 rounded-lg border border-line p-3 text-sm"><b>Interview:</b> {fmtTime(i.scheduledAt)} IST · {i.minutes} min · {i.mode.toLowerCase()} · {i.detail} <a className="ml-2 font-semibold underline" href={`/api/interviews/${i.id}/ics`}>Add to calendar</a></p>)}
          {a.offer && (
            <div className="mt-3 rounded-lg border border-accent/40 p-3 text-sm">
              <p><b>Offer ({a.offer.status.toLowerCase()}):</b> {a.offer.summary}{a.offer.joiningDate && ` · joining ${fmt(a.offer.joiningDate)}`}</p>
              {a.offer.status === "EXTENDED" && a.stage === "OFFER" && <div className="mt-2 flex gap-2"><ActionButton variant="primary" confirm="Accept this offer?" action={respondOffer.bind(null, a.id, true)}>Accept</ActionButton><ActionButton confirm="Decline this offer? This withdraws your application." action={respondOffer.bind(null, a.id, false)}>Decline</ActionButton></div>}
            </div>)}
          {(a.messages.length > 0 || a.stage !== "APPLIED") && a.stage !== "WITHDRAWN" && <Thread applicationId={a.id} me={u.id} messages={a.messages.map((m) => ({ id: m.id, body: m.body, mine: m.senderId === u.id, who: m.sender.name, at: m.createdAt.toISOString() }))} />}
        </Panel>))}</div> : <Empty>No applications yet.</Empty>}
    </>
  );
}
