import { asList } from "@/lib/lists";
import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/session";
import { ActionButton } from "@/components/dash/action-form";
import { Empty, PageTitle, Panel } from "@/components/dash/ui";
import { toggleShortlist } from "@/app/actions/employer";
import { explainMatch } from "@/lib/matching";

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string; year?: string; opp?: string; sort?: string }> }) {
  const u = await requirePageRole("EMPLOYER");
  const { q = "", year = "", opp = "", sort = "" } = await searchParams;
  const mem = await db.employerMember.findUnique({ where: { userId: u.id }, include: { company: { include: { shortlists: true } } } });
  if (!mem || mem.company.status !== "VERIFIED") return (<><PageTitle title="Talent search" /><Panel><Empty>Your company must be verified to search talent.</Empty></Panel></>);
  const yr = Number(year) || undefined;
  // Select only public fields — contact details are never read here.
  // Filtering by skill happens in JS: MySQL has no array columns, and this stays fast at MVP scale.
  const candidates = await db.studentProfile.findMany({
    where: { headline: { not: null }, passportVisibility: { in: ["PUBLIC", "RECRUITERS"] }, user: { suspendedAt: null }, ...(yr ? { graduationYear: yr } : {}) },
    select: { id: true, slug: true, username: true, headline: true, city: true, graduationYear: true, completeness: true, skillsClaimed: true, isSample: true, user: { select: { name: true } }, skills: { select: { skill: true } }, _count: { select: { projects: true } } },
    orderBy: { completeness: "desc" }, take: 500,
  });
  const needle = q.trim().toLowerCase();
  const students = candidates.filter((s) => !needle || [s.headline ?? "", ...asList(s.skillsClaimed), ...s.skills.map((k) => k.skill)].some((t) => t.toLowerCase().includes(needle))).slice(0, 50);
  const saved = new Set(mem.company.shortlists.map((s) => s.studentId));
  const myOpps = await db.opportunity.findMany({ where: { companyId: mem.companyId, closedAt: null }, orderBy: { createdAt: "desc" }, take: 50, select: { id: true, title: true, skills: true, gradYears: true } });
  const target = myOpps.find((o) => o.id === opp);
  const withMatch = students.map((s) => ({ s, m: target ? explainMatch({ wantedSkills: asList(target.skills), gradYears: asList(target.gradYears), student: { verified: s.skills.map((k) => k.skill), claimed: asList(s.skillsClaimed), graduationYear: s.graduationYear } }) : null }));
  // Sorting by match is optional and advisory. Nobody is filtered out or rejected because of a score.
  if (target && sort === "match") withMatch.sort((a, b) => (b.m?.score ?? -1) - (a.m?.score ?? -1));
  return (
    <>
      <PageTitle title="Talent search" sub="Search by skill or headline. Verified evidence is shown separately from self-declared skills." />
      <form className="card mb-6 flex flex-wrap gap-3 p-4"><input name="q" defaultValue={q} placeholder="Skill or headline" className="h-11 min-w-48 flex-1 rounded-xl border border-line bg-surface px-3" /><input name="year" type="number" defaultValue={year} placeholder="Grad year" className="h-11 w-32 rounded-xl border border-line bg-surface px-3" /><select name="opp" defaultValue={opp} aria-label="Compare with a listing" className="h-11 rounded-xl border border-line bg-surface px-3"><option value="">Compare with a listing (optional)</option>{myOpps.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}</select>{target && <select name="sort" defaultValue={sort} aria-label="Order" className="h-11 rounded-xl border border-line bg-surface px-3"><option value="">Most complete profile first</option><option value="match">Best skill match first (advisory)</option></select>}<button className="h-11 rounded-lg bg-accent px-6 font-semibold text-black">Search</button></form>
      {target && <p className="mb-4 text-xs text-ink-soft">Match notes compare each profile with &quot;{target.title}&quot;. They explain overlap only; read the profile and talk to the candidate. Nobody is hidden or rejected because of a score.</p>}
      {students.length ? <ul className="grid gap-4 md:grid-cols-2">{withMatch.map(({ s, m }) => (
        <li key={s.id} className="card p-5"><div className="flex items-start justify-between gap-3"><div><Link className="font-display text-lg font-bold underline" href={`/talent/${s.username ?? s.slug}`}>{s.user.name}</Link>{s.isSample && <span className="ml-2 text-xs text-ink-soft">(sample)</span>}<p className="text-sm text-ink-soft">{s.headline} · {s.graduationYear} · {s.city}</p></div><ActionButton variant={saved.has(s.id) ? "dark" : "secondary"} action={toggleShortlist.bind(null, s.id)}>{saved.has(s.id) ? "Shortlisted" : "Shortlist"}</ActionButton></div>
          <p className="mt-3 text-sm"><b>Verified:</b> {s.skills.length ? s.skills.map((k) => k.skill).join(", ") : "none yet"}</p><p className="text-sm text-ink-soft"><b>Self-declared:</b> {asList(s.skillsClaimed).join(", ") || "—"}</p><p className="mt-1 text-xs text-ink-soft">{s._count.projects} projects · profile {s.completeness}% complete</p>
          {m && <div className="mt-3 rounded-lg bg-muted p-3 text-xs" data-testid="match-note"><p className="font-semibold">{m.score === null ? "Listing names no skills to compare" : `Skill overlap indicator ${m.score}/100`}</p><ul className="mt-1 list-disc space-y-0.5 pl-4 text-ink-soft">{m.reasons.map((r) => <li key={r}>{r}</li>)}</ul></div>}</li>))}</ul> : <Empty>No matching students.</Empty>}
    </>
  );
}
