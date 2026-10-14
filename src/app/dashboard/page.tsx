import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/session";
import { completeness } from "@/lib/completeness";
import { Button } from "@/components/ui/button";
import { PageTitle, Panel, Serif, Stat, Empty, Status } from "@/components/dash/ui";
import { CompanyLogo } from "@/components/ui/company-logo";
import { reviewCollege, reviewCompany, reviewMentor } from "@/app/actions/admin";
import { ActionButton } from "@/components/dash/action-form";
import { Workspace } from "@/components/dash/workspace";

export default async function Overview() {
  const u = await requirePageRole();
  const home = await roleHome(u);
  return (<>{home}<Workspace role={u.role} /></>);
}

async function roleHome(u: Awaited<ReturnType<typeof requirePageRole>>) {
  switch (u.role) {
    case "STUDENT": return <StudentHome userId={u.id} name={u.name} />;
    case "MENTOR": return <MentorHome userId={u.id} />;
    case "EMPLOYER": return <EmployerHome userId={u.id} />;
    case "PLATFORM_ADMIN": return <AdminHome />;
    default: return (<><PageTitle title="College dashboard" /><Panel><p className="text-ink-soft">Track how your students are doing and see which of them chose to share their progress.</p><Button asChild className="mt-4"><Link href="/dashboard/college">Open college dashboard</Link></Button></Panel></>);
  }
}

async function StudentHome({ userId, name }: { userId: string; name: string }) {
  const p = await db.studentProfile.findUniqueOrThrow({ where: { userId }, include: { projects: true, applications: { include: { opportunity: { include: { company: true } } }, orderBy: { createdAt: "desc" }, take: 5 } } });
  const ev = await db.skillEvidence.count({ where: { studentId: p.id } });
  const { score, todo } = completeness(p, ev);
  return (
    <>
      <PageTitle title={<>Hi <Serif>{name.split(" ")[0]}</Serif></>} sub="Build proof, get noticed." />
      <div className="grid gap-6 md:grid-cols-3">
        <Panel title="Profile completeness" className="md:col-span-2">
          <div className="flex items-center gap-4"><div className="h-3 flex-1 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={score} aria-valuemin={0} aria-valuemax={100} aria-label="Profile completeness"><div className="h-full rounded-full bg-accent" style={{ width: `${score}%` }} /></div><b className="font-display text-2xl">{score}%</b></div>
          {todo.length ? <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-ink-soft">{todo.map((t) => <li key={t}>{t}</li>)}</ul> : <p className="mt-4 text-sm text-ink-soft">Your profile is complete. Keep adding projects.</p>}
          <div className="mt-5 flex flex-wrap gap-3"><Button asChild><Link href="/dashboard/profile">Edit profile</Link></Button><Button asChild variant="secondary"><Link href={`/talent/${p.username ?? p.slug}`}>View my Talent Card</Link></Button></div>
        </Panel>
        <Stat label="Projects" value={p.projects.length} tone="sun" />
      </div>
      <Panel title="Recent applications" className="mt-6" action={<Link href="/dashboard/applications" className="text-sm font-semibold underline">All</Link>}>
        {p.applications.length ? <ul className="divide-y divide-line">{p.applications.map((a) => <li key={a.id} className="flex items-center justify-between py-3"><span>{a.opportunity.title} <span className="text-ink-soft">· {a.opportunity.company.name}</span></span><Status s={a.stage} /></li>)}</ul> : <Empty>No applications yet. <Link className="font-semibold underline" href="/opportunities">Browse opportunities</Link></Empty>}
      </Panel>
    </>
  );
}

async function MentorHome({ userId }: { userId: string }) {
  const m = await db.mentorProfile.findUnique({ where: { userId }, include: { sessions: true, endorsementsGiven: true } });
  if (!m) return (<><PageTitle title="Welcome, mentor" /><Panel><p className="text-ink-soft">Set up your mentor profile to get verified and start receiving requests.</p><Button asChild className="mt-4"><Link href="/dashboard/mentoring">Create mentor profile</Link></Button></Panel></>);
  const done = m.sessions.filter((s) => s.status === "COMPLETED");
  return (
    <>
      <PageTitle title="Mentor overview" sub={m.status === "VERIFIED" ? "You're verified and visible in the directory." : m.status === "PENDING" ? "Your profile is awaiting verification." : "Your profile was not approved."} />
      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Status" value={<Status s={m.status} />} />
        <Stat label="Students guided" value={new Set(done.map((s) => s.studentId)).size} />
        <Stat label="Sessions completed" value={done.length} />
        <Stat label="Endorsements given" value={m.endorsementsGiven.length} />
      </div>
      <Button asChild className="mt-6"><Link href="/dashboard/mentoring">Manage sessions & slots</Link></Button>
    </>
  );
}

async function EmployerHome({ userId }: { userId: string }) {
  const mem = await db.employerMember.findUnique({ where: { userId }, include: { company: { include: { opportunities: { include: { _count: { select: { applications: true } } } } } } } });
  if (!mem) return (<><PageTitle title="Welcome" /><Panel><p className="text-ink-soft">Register your company. We verify every company before it can post roles or search talent.</p><Button asChild className="mt-4"><Link href="/dashboard/company">Register company</Link></Button></Panel></>);
  const c = mem.company;
  return (
    <>
      <PageTitle title={<span className="flex items-center gap-4"><CompanyLogo name={c.name} logoId={c.logoId} className="h-14 w-14" />{c.name}</span>} sub={c.status === "VERIFIED" ? "Verified employer" : c.status === "PENDING" ? "Verification pending — you can't post or search yet." : "Verification was not approved."} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Status" value={<Status s={c.status} />} />
        <Stat label="Roles" value={c.opportunities.length} tone="lilac" />
        <Stat label="Applications" value={c.opportunities.reduce((n, o) => n + o._count.applications, 0)} tone="mint" />
      </div>
      <div className="mt-6 flex gap-3"><Button asChild><Link href="/dashboard/roles">Post a role</Link></Button><Button asChild variant="secondary"><Link href="/dashboard/pipeline">Open pipeline</Link></Button></div>
    </>
  );
}

async function AdminHome() {
  const [students, mentors, companies, opps, apps, reports, pc, pm] = await Promise.all([
    db.user.count({ where: { role: "STUDENT" } }), db.mentorProfile.count({ where: { status: "VERIFIED" } }), db.company.count({ where: { status: "VERIFIED" } }),
    db.opportunity.count({ where: { moderated: "VERIFIED" } }), db.application.count(), db.report.count({ where: { resolvedAt: null } }),
    db.company.findMany({ where: { status: "PENDING" }, include: { members: { include: { user: true } } } }),
    db.mentorProfile.findMany({ where: { status: "PENDING" }, include: { user: true } }),
  ]);
  const pcol = await db.college.findMany({ where: { status: "PENDING" } });
  return (
    <>
      <PageTitle title="Admin overview" />
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Students" value={students} tone="lilac" /><Stat label="Verified mentors" value={mentors} tone="sun" /><Stat label="Verified companies" value={companies} tone="mint" />
        <Stat label="Live listings" value={opps} /><Stat label="Applications" value={apps} /><Stat label="Open reports" value={reports} tone="primary" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title={`Company verification (${pc.length})`}>
          {pc.length ? <ul className="divide-y divide-line">{pc.map((c) => (
            <li key={c.id} className="py-3"><p className="font-semibold">{c.name}{c.isSample && " (sample)"}</p><p className="text-sm text-ink-soft">{c.website} · {c.members[0]?.user.email}</p>{c.about && <p className="mt-1 text-sm">{c.about}</p>}
              <div className="mt-2 flex gap-2"><ActionButton variant="primary" action={reviewCompany.bind(null, c.id, "VERIFIED")}>Verify</ActionButton><ActionButton action={reviewCompany.bind(null, c.id, "REJECTED")}>Reject</ActionButton></div></li>))}</ul> : <Empty>Queue is clear.</Empty>}
        </Panel>
        <Panel title={`Mentor verification (${pm.length})`}>
          {pm.length ? <ul className="divide-y divide-line">{pm.map((m) => (
            <li key={m.id} className="py-3"><p className="font-semibold">{m.user.name}</p><p className="text-sm text-ink-soft">{m.roleTitle} · {m.company} · {m.country}</p>{m.bio && <p className="mt-1 text-sm">{m.bio}</p>}
              <div className="mt-2 flex gap-2"><ActionButton variant="primary" action={reviewMentor.bind(null, m.id, "VERIFIED")}>Verify</ActionButton><ActionButton action={reviewMentor.bind(null, m.id, "REJECTED")}>Reject</ActionButton></div></li>))}</ul> : <Empty>Queue is clear.</Empty>}
        </Panel>
      </div>
      <Panel title={`College verification (${pcol.length})`} className="mt-6">
        {pcol.length ? <ul className="divide-y divide-line">{pcol.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="font-semibold">{c.name}</p><p className="text-sm text-ink-soft">{c.city}</p></div>
            <div className="flex gap-2"><ActionButton variant="primary" action={reviewCollege.bind(null, c.id, "VERIFIED")}>Verify</ActionButton><ActionButton action={reviewCollege.bind(null, c.id, "REJECTED")}>Reject</ActionButton></div></li>))}</ul> : <Empty>Queue is clear.</Empty>}
      </Panel>
    </>
  );
}
