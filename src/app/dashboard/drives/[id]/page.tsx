import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/session";
import { ActionButton } from "@/components/dash/action-form";
import { Empty, PageTitle, Panel, Stat, Status, fmt } from "@/components/dash/ui";
import { closeDrive, inviteEligible, setOutcome } from "@/app/actions/drives";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const u = await requirePageRole("COLLEGE_ADMIN", "EMPLOYER");
  const { id } = await params;
  const d = await db.drive.findUnique({ where: { id }, include: { college: true, company: true } });
  if (!d) notFound();
  const isCollege = u.role === "COLLEGE_ADMIN";
  if (isCollege) { const m = await db.collegeAdmin.findUnique({ where: { userId: u.id } }); if (m?.collegeId !== d.collegeId) notFound(); }
  else { const m = await db.employerMember.findUnique({ where: { userId: u.id } }); if (m?.companyId !== d.companyId) notFound(); }
  const invites = await db.driveInvite.findMany({ where: { driveId: d.id }, orderBy: { invitedAt: "asc" }, include: { student: { include: { user: { select: { name: true } }, department: true } } } });
  const by = (s: string) => invites.filter((i) => i.status === s).length;
  // Companies only ever see students who accepted; colleges see everyone they invited (all of whom opted in to college sharing).
  const shown = isCollege ? invites : invites.filter((i) => i.status === "ACCEPTED");
  return (
    <>
      <PageTitle title={d.title} sub={`${d.company.name} · ${d.college.name} · ${fmt(d.driveDate)} · ${d.status.toLowerCase()}`} />
      <p className="mb-6 text-sm"><Link className="font-semibold underline" href="/dashboard/drives">← All drives</Link></p>
      <div className="grid gap-4 sm:grid-cols-4"><Stat label="Invited" value={invites.length} /><Stat label="Accepted" value={by("ACCEPTED")} /><Stat label="Declined" value={by("DECLINED")} /><Stat label="Hired" value={invites.filter((i) => i.outcome === "HIRED").length} /></div>
      {isCollege && (d.status === "CONFIRMED" || d.status === "PROPOSED") && (
        <div className="mt-6 flex flex-wrap gap-2">
          {d.status === "CONFIRMED" && <ActionButton variant="primary" action={inviteEligible.bind(null, d.id)}>Invite eligible students</ActionButton>}
          <ActionButton confirm="Close this drive?" action={closeDrive.bind(null, d.id)}>Close drive</ActionButton>
          {d.status === "PROPOSED" && <p className="self-center text-sm text-ink-soft">Waiting for {d.company.name} to confirm.</p>}
        </div>)}
      <Panel title={isCollege ? "Students" : "Students who joined"} className="mt-6">
        {shown.length ? <ul className="divide-y divide-line">{shown.map((i) => (
          <li key={i.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div><p className="font-semibold">{i.student.user.name}</p><p className="text-sm text-ink-soft">{i.student.headline} · {i.student.department?.name ?? "No department"} · class of {i.student.graduationYear ?? "?"}{!isCollege && <> · <a className="underline" href={`/talent/${i.student.username ?? i.student.slug}`}>Talent Passport</a></>}</p></div>
            <div className="flex flex-wrap items-center gap-2"><Status s={i.status} />{i.outcome !== "NONE" && <Status s={i.outcome} />}
              {!isCollege && i.status === "ACCEPTED" && (["SHORTLISTED", "OFFERED", "HIRED", "NOT_SELECTED"] as const).map((o) => <ActionButton key={o} variant={i.outcome === o ? "dark" : "secondary"} action={setOutcome.bind(null, i.id, o)}>{o.replace("_", " ").toLowerCase()}</ActionButton>)}</div>
          </li>))}</ul> : <Empty>{isCollege ? "No invitations sent yet." : "No students have joined yet."}</Empty>}
      </Panel>
    </>
  );
}
