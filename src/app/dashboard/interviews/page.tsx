import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/session";
import { ActionButton } from "@/components/dash/action-form";
import { Empty, PageTitle, Panel, Status, fmtTime } from "@/components/dash/ui";
import { setInterviewStatus } from "@/app/actions/employer";

export default async function Page() {
  const u = await requirePageRole("STUDENT", "EMPLOYER");
  const isStudent = u.role === "STUDENT";
  const company = isStudent ? null : (await db.employerMember.findUnique({ where: { userId: u.id } }))?.companyId;
  if (!isStudent && !company) return (<><PageTitle title="Interviews" /><Panel><Empty>Create and verify your company first.</Empty></Panel></>);
  const items = await db.interview.findMany({
    where: { application: isStudent ? { student: { userId: u.id } } : { opportunity: { companyId: company! } }, OR: [{ status: "SCHEDULED" }, { scheduledAt: { gt: new Date(Date.now() - 14 * 86_400_000) } }] },
    orderBy: { scheduledAt: "asc" }, take: 100,
    include: { application: { include: { opportunity: { include: { company: true } }, student: { include: { user: { select: { name: true } } } } } } },
  });
  const upcoming = items.filter((i) => i.status === "SCHEDULED" && i.scheduledAt > new Date());
  const rest = items.filter((i) => !upcoming.includes(i));
  const row = (i: (typeof items)[number], live: boolean) => (
    <li key={i.id} className="py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="font-semibold">{i.application.opportunity.title} <span className="text-ink-soft">· {isStudent ? i.application.opportunity.company.name : i.application.student.user.name}</span></p>
          <p className="text-sm text-ink-soft">{fmtTime(i.scheduledAt)} IST · {i.minutes} min · {i.mode.toLowerCase()}</p>
          <p className="text-sm">{i.detail}</p>{i.notes && <p className="text-sm text-ink-soft">{i.notes}</p>}</div>
        <div className="flex flex-wrap items-center gap-2"><Status s={i.status} />
          {live && <a className="text-sm font-semibold underline" href={`/api/interviews/${i.id}/ics`}>Add to calendar</a>}
          {live && !isStudent && <><ActionButton action={setInterviewStatus.bind(null, i.id, "COMPLETED")}>Mark done</ActionButton><ActionButton confirm="Cancel this interview?" action={setInterviewStatus.bind(null, i.id, "CANCELLED")}>Cancel</ActionButton></>}</div>
      </div>
    </li>);
  return (
    <>
      <PageTitle title="Interviews" sub="Times are shown in IST. The calendar file includes the link or address." />
      <div className="space-y-6">
        <Panel title="Upcoming">{upcoming.length ? <ul className="divide-y divide-line">{upcoming.map((i) => row(i, true))}</ul> : <Empty>No upcoming interviews.</Empty>}</Panel>
        {rest.length > 0 && <Panel title="Recent and past"><ul className="divide-y divide-line">{rest.map((i) => row(i, i.status === "SCHEDULED" && i.scheduledAt > new Date()))}</ul></Panel>}
      </div>
    </>
  );
}
