import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/session";
import { ActionForm, Area, Field } from "@/components/dash/action-form";
import { Empty, PageTitle, Panel, Status, fmt } from "@/components/dash/ui";
import { closeOpportunity, postOpportunity, reopenOpportunity } from "@/app/actions/employer";
import { ActionButton } from "@/components/dash/action-form";

const sel = "mt-1.5 h-11 w-full rounded-xl border border-line bg-surface px-3";

export default async function Page() {
  const u = await requirePageRole("EMPLOYER");
  const mem = await db.employerMember.findUnique({ where: { userId: u.id }, include: { company: { include: { opportunities: { orderBy: { createdAt: "desc" } } } } } });
  if (!mem || mem.company.status !== "VERIFIED") return (<><PageTitle title="Roles & challenges" /><Panel><Empty>Your company must be verified before you can post. Check the Company page.</Empty></Panel></>);
  return (
    <>
      <PageTitle title="Roles & challenges" sub="Pay, work mode, location and eligibility are required. New listings are reviewed before going live." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Post a listing">
          <ActionForm action={postOpportunity} reset submit="Submit for review" success="Submitted for review">
            <Field label="Title" name="title" required />
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold">Type<select name="type" className={sel}><option value="INTERNSHIP">Internship</option><option value="JOB">Job</option><option value="CHALLENGE">Challenge</option></select></label>
              <label className="block text-sm font-semibold">Work mode<select name="workMode" className={sel}><option value="REMOTE">Remote</option><option value="HYBRID">Hybrid</option><option value="ONSITE">On-site</option></select></label>
            </div>
            <Area label="Description" name="description" required minLength={30} />
            <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" name="unpaid" value="true" className="h-4 w-4 accent-neon" />This role is unpaid (will be labelled clearly)</label>
            <div className="grid gap-4 sm:grid-cols-2"><Field label="Pay (as shown to students)" name="payText" required placeholder="₹20,000 / month · or: certificate only" /><Field label="Monthly amount (₹) for filters" name="monthlyINR" type="number" min={0} defaultValue={0} /></div>
            <div className="grid gap-4 sm:grid-cols-2"><Field label="Location" name="location" required /><Field label="Deadline" name="deadline" type="date" required /></div>
            <Field label="Eligibility" name="eligibility" required placeholder="2026 graduates, any branch" />
            <div className="grid gap-4 sm:grid-cols-2"><Field label="Graduation years" name="gradYears" placeholder="2025, 2026" /><Field label="Skills" name="skills" placeholder="React, SQL" /></div>
          </ActionForm>
        </Panel>
        <Panel title="Your listings">{mem.company.opportunities.length ? <ul className="divide-y divide-line">{mem.company.opportunities.map((o) => <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-3"><div><p className="font-semibold">{o.title}</p><p className="text-sm text-ink-soft">{o.payText} · {o.closedAt ? "closed by you" : `closes ${fmt(o.deadline)}`}</p></div><div className="flex items-center gap-2"><Status s={o.closedAt ? "CLOSED" : o.moderated} />{o.closedAt ? <ActionButton action={reopenOpportunity.bind(null, o.id)}>Reopen</ActionButton> : <ActionButton confirm="Close this listing? It will stop accepting applications." action={closeOpportunity.bind(null, o.id)}>Close</ActionButton>}</div></li>)}</ul> : <Empty>No listings yet.</Empty>}</Panel>
      </div>
    </>
  );
}
