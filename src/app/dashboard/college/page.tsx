import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/session";
import { ActionForm, Field } from "@/components/dash/action-form";
import { Empty, PageTitle, Panel, Stat, Status } from "@/components/dash/ui";
import { createCollege } from "@/app/actions/college";
import { ActionButton } from "@/components/dash/action-form";
import { addDepartment, deleteDepartment } from "@/app/actions/drives";
import Link from "next/link";

const RANK = ["APPLIED", "UNDER_REVIEW", "SHORTLISTED", "INTERVIEW", "OFFER", "HIRED"] as const;

export default async function Page() {
  const u = await requirePageRole("COLLEGE_ADMIN");
  const mem = await db.collegeAdmin.findUnique({ where: { userId: u.id }, include: { college: true } });
  if (!mem) {
    return (
      <>
        <PageTitle title="Register your college" sub="We verify every college before students can select it." />
        <Panel><ActionForm action={createCollege} submit="Submit for verification" success="Submitted"><Field label="College name" name="name" required minLength={3} /><Field label="City" name="city" required /></ActionForm></Panel>
      </>
    );
  }
  const c = mem.college;
  if (c.status !== "VERIFIED") {
    return (<><PageTitle title={c.name} /><Panel><div className="flex items-center gap-3"><Status s={c.status} /><p className="text-sm text-ink-soft">{c.status === "PENDING" ? "We'll notify you once the review is done. Students can select your college after approval." : "This college was not approved. Contact support to appeal."}</p></div></Panel></>);
  }

  const students = await db.studentProfile.findMany({
    where: { collegeId: c.id },
    select: { completeness: true, shareWithCollege: true, headline: true, graduationYear: true, user: { select: { name: true } }, applications: { select: { stage: true } }, _count: { select: { skills: true, projects: true } } }, // no contact fields, ever
    orderBy: { completeness: "desc" },
  });
  const depts = await db.department.findMany({ where: { collegeId: c.id }, orderBy: { name: "asc" } });
  const all = students.flatMap((s) => s.applications);
  const avg = students.length ? Math.round(students.reduce((n, s) => n + s.completeness, 0) / students.length) : 0;
  const roster = students.filter((s) => s.shareWithCollege);
  const best = (apps: { stage: string }[]) => apps.reduce((b, a) => (RANK.indexOf(a.stage as (typeof RANK)[number]) > RANK.indexOf(b as (typeof RANK)[number]) ? a.stage : b), "—");
  return (
    <>
      <PageTitle title={c.name} sub={`${c.city} · verified college`} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Students joined" value={students.length} /><Stat label="Avg. profile score" value={`${avg}%`} /><Stat label="With verified evidence" value={students.filter((s) => s._count.skills > 0).length} />
        <Stat label="Applications" value={all.length} /><Stat label="Offers" value={all.filter((a) => a.stage === "OFFER" || a.stage === "HIRED").length} />
      </div>
      <Panel title={`Students who shared their progress (${roster.length} of ${students.length})`} className="mt-6">
        {roster.length ? (
          <div className="overflow-x-auto" role="region" aria-label="Students who shared their progress" tabIndex={0}><table className="w-full text-left text-sm"><thead className="text-ink-soft"><tr><th className="py-2 pr-4 font-semibold">Student</th><th className="pr-4 font-semibold">Headline</th><th className="pr-4 font-semibold">Year</th><th className="pr-4 font-semibold">Profile</th><th className="pr-4 font-semibold">Projects</th><th className="pr-4 font-semibold">Applications</th><th className="font-semibold">Furthest stage</th></tr></thead>
            <tbody className="divide-y divide-line">{roster.map((s, i) => <tr key={i}><td className="py-2 pr-4 font-semibold">{s.user.name}</td><td className="pr-4">{s.headline}</td><td className="pr-4">{s.graduationYear}</td><td className="pr-4">{s.completeness}%</td><td className="pr-4">{s._count.projects}</td><td className="pr-4">{s.applications.length}</td><td>{best(s.applications).toLowerCase()}</td></tr>)}</tbody></table></div>
        ) : <Empty>No students have shared yet. Ask them to choose your college in Profile and tick the sharing box.</Empty>}
        <p className="mt-4 text-xs text-ink-soft">Only students who opted in appear here, with no contact details. Totals above include all students who selected your college.</p>
      </Panel>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Departments">
          {depts.length ? <ul className="mb-4 divide-y divide-line text-sm">{depts.map((d) => <li key={d.id} className="flex items-center justify-between py-2">{d.name}<ActionButton variant="ghost" confirm={`Remove ${d.name}? Students keep their profile but lose this department.`} action={deleteDepartment.bind(null, d.id)}>Remove</ActionButton></li>)}</ul> : <p className="mb-4 text-sm text-ink-soft">No departments yet. Add them so students can pick one and drives can target them.</p>}
          <ActionForm action={addDepartment} reset submit="Add department" success="Added" className="space-y-2"><Field label="Department name" name="name" required maxLength={80} /></ActionForm>
        </Panel>
        <Panel title="Drives and reports">
          <p className="text-sm text-ink-soft">Run campus placement drives with verified companies, then export reports. Reports include only students who opted in, never email or phone, and every download is logged.</p>
          <p className="mt-3"><Link className="font-semibold underline" href="/dashboard/drives">Placement drives</Link></p>
          <ul className="mt-3 space-y-1 text-sm"><li><a className="font-semibold underline" href="/api/college/report?type=roster">Download student roster (CSV)</a></li><li><a className="font-semibold underline" href="/api/college/report?type=drives">Download drives summary (CSV)</a></li></ul>
        </Panel>
      </div>
    </>
  );
}
