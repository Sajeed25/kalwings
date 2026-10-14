import { db } from "@/lib/db";
import type { ApplicationStage } from "@prisma/client";
import { requirePageRole } from "@/lib/session";
import { ActionButton, ActionForm, Field } from "@/components/dash/action-form";
import { Empty, PageTitle, Panel } from "@/components/dash/ui";
import { saveNotes, setStage } from "@/app/actions/employer";
import { Thread } from "@/components/dash/thread";

const COLS: { stage: ApplicationStage; label: string }[] = [{ stage: "APPLIED", label: "Applied" }, { stage: "SHORTLISTED", label: "Shortlisted" }, { stage: "INTERVIEW", label: "Interview" }, { stage: "OFFER", label: "Offer" }];

export default async function Page() {
  const u = await requirePageRole("EMPLOYER");
  const mem = await db.employerMember.findUnique({ where: { userId: u.id }, include: { company: true } });
  if (!mem || mem.company.status !== "VERIFIED") return (<><PageTitle title="Pipeline" /><Panel><Empty>Your company must be verified to use the pipeline.</Empty></Panel></>);
  const apps = await db.application.findMany({
    where: { opportunity: { companyId: mem.company.id }, stage: { in: [...COLS.map((c) => c.stage), "REJECTED"] } }, orderBy: { createdAt: "desc" },
    include: { opportunity: true, messages: { orderBy: { createdAt: "asc" }, include: { sender: true } }, student: { include: { user: { select: { name: true, email: true, phone: true } } } } },
  });
  return (
    <>
      <PageTitle title="Pipeline" sub="Move candidates forward, keep private notes, and message them." />
      <div className="grid gap-4 xl:grid-cols-4">
        {COLS.map((c, ci) => (
          <section key={c.stage} aria-label={c.label} className="min-w-0">
            <h2 className="mb-3 font-sans text-sm font-semibold tracking-normal text-ink-soft">{c.label} ({apps.filter((a) => a.stage === c.stage).length})</h2>
            <div className="space-y-3">{apps.filter((a) => a.stage === c.stage).map((a) => {
              const next = COLS[ci + 1]?.stage;
              return (
                <article key={a.id} className="card p-4 text-sm">
                  <p className="font-display font-bold">{a.student.user.name}</p><p className="text-ink-soft">{a.opportunity.title}</p>
                  {a.student.contactVisible ? <p className="mt-1 text-xs">{a.student.user.email ?? a.student.user.phone}</p> : <p className="mt-1 text-xs text-ink-soft">Contact private — use messages</p>}
                  <a href={`/talent/${a.student.username ?? a.student.slug}`} className="mt-1 inline-block text-xs font-semibold underline">Talent Card</a>
                  <div className="mt-3 flex flex-wrap gap-2">{next && <ActionButton variant="primary" action={setStage.bind(null, a.id, next)}>Move to {COLS[ci + 1].label}</ActionButton>}<ActionButton confirm="Reject this candidate?" action={setStage.bind(null, a.id, "REJECTED")}>Reject</ActionButton></div>
                  <details className="mt-3"><summary className="cursor-pointer font-semibold">Notes & messages</summary>
                    <ActionForm action={saveNotes} submit="Save notes" success="Saved" className="mt-2 space-y-2"><input type="hidden" name="applicationId" value={a.id} /><Field label="Private notes" name="notes" defaultValue={a.employerNotes ?? ""} maxLength={1000} /></ActionForm>
                    <Thread applicationId={a.id} messages={a.messages.map((m) => ({ id: m.id, body: m.body, mine: m.senderId === u.id, who: m.sender.name, at: m.createdAt.toISOString() }))} />
                  </details>
                </article>);
            })}</div>
          </section>))}
      </div>
    </>
  );
}
