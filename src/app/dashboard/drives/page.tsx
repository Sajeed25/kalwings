import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/session";
import { ActionButton, ActionForm, Area, Field } from "@/components/dash/action-form";
import { Empty, PageTitle, Panel, Status, fmt } from "@/components/dash/ui";
import { createDrive, respondDrive, respondInvite } from "@/app/actions/drives";

const sel = "mt-1.5 h-11 w-full rounded-lg border border-line bg-surface px-3 text-[15px]";

export default async function Page() {
  const u = await requirePageRole("COLLEGE_ADMIN", "EMPLOYER", "STUDENT");
  if (u.role === "STUDENT") {
    const sp = await db.studentProfile.findUniqueOrThrow({ where: { userId: u.id } });
    const invites = await db.driveInvite.findMany({ where: { studentId: sp.id }, orderBy: { invitedAt: "desc" }, include: { drive: { include: { company: true, college: true } } } });
    return (
      <>
        <PageTitle title="Campus drives" sub="Your college can invite you to placement drives. Accepting shares your name, headline, department and Passport link with that company for that drive only." />
        {invites.length ? <div className="space-y-4">{invites.map((i) => (
          <Panel key={i.id}>
            <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-display text-lg font-bold">{i.drive.title}</p><p className="text-sm text-ink-soft">{i.drive.company.name} · {i.drive.college.name} · {fmt(i.drive.driveDate)}</p></div>
              <div className="flex items-center gap-2"><Status s={i.status} />{i.outcome !== "NONE" && <Status s={i.outcome} />}</div></div>
            <p className="mt-3 whitespace-pre-line text-sm">{i.drive.description}</p>
            {i.status === "INVITED" && <div className="mt-3 flex gap-2"><ActionButton variant="primary" action={respondInvite.bind(null, i.id, true)}>Accept and share my details</ActionButton><ActionButton action={respondInvite.bind(null, i.id, false)}>Decline</ActionButton></div>}
          </Panel>))}</div> : <Empty>No invitations yet. To be invited, choose your verified college in Profile and tick the sharing box.</Empty>}
      </>
    );
  }
  if (u.role === "EMPLOYER") {
    const mem = await db.employerMember.findUnique({ where: { userId: u.id }, include: { company: true } });
    if (!mem || mem.company.status !== "VERIFIED") return (<><PageTitle title="Campus drives" /><Panel><Empty>Your company must be verified first.</Empty></Panel></>);
    const drives = await db.drive.findMany({ where: { companyId: mem.companyId }, orderBy: { driveDate: "desc" }, include: { college: true, _count: { select: { invites: { where: { status: "ACCEPTED" } } } } } });
    return (
      <>
        <PageTitle title="Campus drives" sub="Colleges propose drives to your company. Confirm to let them invite their opted-in students." />
        {drives.length ? <div className="space-y-4">{drives.map((d) => (
          <Panel key={d.id}>
            <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-display text-lg font-bold">{d.title}</p><p className="text-sm text-ink-soft">{d.college.name} · {fmt(d.driveDate)} · {d._count.invites} student{d._count.invites === 1 ? "" : "s"} joined</p></div><Status s={d.status} /></div>
            <p className="mt-3 whitespace-pre-line text-sm">{d.description}</p>
            <div className="mt-3 flex flex-wrap gap-2">{d.status === "PROPOSED" && <><ActionButton variant="primary" action={respondDrive.bind(null, d.id, true)}>Confirm</ActionButton><ActionButton action={respondDrive.bind(null, d.id, false)}>Decline</ActionButton></>}{(d.status === "CONFIRMED" || d.status === "CLOSED") && <Link className="text-sm font-semibold underline" href={`/dashboard/drives/${d.id}`}>Participants and outcomes</Link>}</div>
          </Panel>))}</div> : <Empty>No drives yet.</Empty>}
      </>
    );
  }
  const mem = await db.collegeAdmin.findUnique({ where: { userId: u.id }, include: { college: true } });
  if (!mem || mem.college.status !== "VERIFIED") return (<><PageTitle title="Placement drives" /><Panel><Empty>Your college must be verified first.</Empty></Panel></>);
  const [companies, depts, drives] = await Promise.all([
    db.company.findMany({ where: { status: "VERIFIED" }, orderBy: { name: "asc" }, select: { id: true, name: true }, take: 300 }),
    db.department.findMany({ where: { collegeId: mem.collegeId }, orderBy: { name: "asc" } }),
    db.drive.findMany({ where: { collegeId: mem.collegeId }, orderBy: { driveDate: "desc" }, include: { company: true, invites: { select: { status: true } } } }),
  ]);
  return (
    <>
      <PageTitle title="Placement drives" sub="Propose a drive to a verified company. Once it confirms, invite the students who opted in and match your criteria." />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <Panel title="Your drives">{drives.length ? <ul className="divide-y divide-line">{drives.map((d) => (
          <li key={d.id} className="py-3"><div className="flex flex-wrap items-center justify-between gap-2"><Link className="font-semibold underline" href={`/dashboard/drives/${d.id}`}>{d.title}</Link><Status s={d.status} /></div>
            <p className="text-sm text-ink-soft">{d.company.name} · {fmt(d.driveDate)} · {d.invites.length} invited, {d.invites.filter((i) => i.status === "ACCEPTED").length} accepted</p></li>))}</ul> : <Empty>No drives yet.</Empty>}</Panel>
        <Panel title="Propose a drive">
          <ActionForm action={createDrive} reset submit="Propose to company" success="Proposed. The company will be notified." className="space-y-4">
            <label className="block text-sm font-semibold">Company<select name="companyId" className={sel} required><option value="">Choose a verified company</option>{companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
            <Field label="Title" name="title" required />
            <Area label="Roles, process and timeline" name="description" required maxLength={2000} />
            <Field label="Drive date" name="driveDate" type="date" required />
            <Field label="Eligible graduation years (optional)" name="gradYears" placeholder="2026, 2027" />
            <Field label="Minimum profile score % (optional)" name="minCompleteness" type="number" min={0} max={100} defaultValue={0} />
            {depts.length > 0 && <fieldset className="text-sm"><legend className="font-semibold">Eligible departments (none ticked = all)</legend><div className="mt-1 flex flex-wrap gap-4">{depts.map((d) => <label key={d.id} className="flex items-center gap-2"><input type="checkbox" name="departmentIds" value={d.id} className="h-4 w-4 accent-neon" />{d.name}</label>)}</div></fieldset>}
          </ActionForm>
        </Panel>
      </div>
    </>
  );
}
