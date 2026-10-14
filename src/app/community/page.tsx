import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { getUser } from "@/lib/session";
import { PageHero, Block } from "@/components/pages/shell";
import { Community } from "@/components/home/rest";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActionButton, ActionForm, Area, Field } from "@/components/dash/action-form";
import { createGroup, joinCollegeGroup } from "@/app/actions/community";

export const metadata: Metadata = { title: "Community", description: "College communities, interest groups, project teams and events: learning in public, together." };
export const dynamic = "force-dynamic";
const sel = "mt-1.5 h-11 w-full rounded-lg border border-line bg-surface px-3 text-[15px]";

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string; kind?: string }> }) {
  const sp = await searchParams;
  const me = await getUser();
  const q = sp.q?.trim().slice(0, 60);
  const kind = sp.kind === "INTEREST" || sp.kind === "PROJECT" ? sp.kind : undefined;
  let groups: Awaited<ReturnType<typeof load>> = [];
  let college: { slug: string; name: string } | null = null;
  let collegeName: string | null = null;
  async function load() {
    return db.group.findMany({ where: { archivedAt: null, kind: kind ?? { not: "COLLEGE" }, ...(q ? { OR: [{ name: { contains: q } }, { description: { contains: q } }] } : {}) }, orderBy: { createdAt: "desc" }, take: 40, include: { _count: { select: { members: true, posts: true } } } });
  }
  try {
    groups = await load();
    if (me?.role === "STUDENT") {
      const s = await db.studentProfile.findUnique({ where: { userId: me.id }, include: { college: true } });
      if (s?.college?.status === "VERIFIED") {
        collegeName = s.college.name;
        college = await db.group.findFirst({ where: { kind: "COLLEGE", collegeId: s.college.id, archivedAt: null, members: { some: { userId: me.id } } }, select: { slug: true, name: true } });
      }
    }
  } catch (e) { console.error("[community] load failed:", e instanceof Error ? e.message : e); }
  const writer = me?.role === "STUDENT" || me?.role === "MENTOR";
  return (
    <>
      <PageHero eyebrow="Community" title="Builders helping builders." lead="Join a group, ask real questions, find teammates and share events. No likes, no endless scroll: just useful, newest-first conversations.">
        <div className="flex flex-wrap gap-3">{!me && <Button asChild size="lg"><Link href="/join">Join Kalwings</Link></Button>}<Button asChild size="lg" variant="secondary"><Link href="/community/teammates">Find teammates</Link></Button></div>
      </PageHero>
      <Block>
        {me?.role === "STUDENT" && collegeName && (
          <div className="card mb-8 flex flex-wrap items-center justify-between gap-3 p-5"><div><h2 className="text-lg">Your college community</h2><p className="text-sm text-ink-soft">{collegeName}</p></div>
            {college ? <Button asChild><Link href={`/community/${college.slug}`}>Open</Link></Button> : <ActionButton variant="primary" action={joinCollegeGroup}>Join</ActionButton>}</div>)}
        <form className="mb-6 flex flex-wrap gap-2" role="search"><label className="sr-only" htmlFor="q">Search groups</label>
          <input id="q" name="q" defaultValue={q} placeholder="Search groups" className="h-11 min-w-[220px] flex-1 rounded-lg border border-line bg-surface px-3" />
          <select name="kind" defaultValue={kind ?? ""} aria-label="Group type" className="h-11 rounded-lg border border-line bg-surface px-3"><option value="">All types</option><option value="INTEREST">Interest</option><option value="PROJECT">Project</option></select>
          <button className="h-11 rounded-lg bg-neon px-4 font-semibold text-black">Search</button></form>
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          {groups.length ? <ul className="grid gap-4 sm:grid-cols-2">{groups.map((g) => (
            <li key={g.id} className="card card-hover p-5"><Badge tone="accent">{g.kind.toLowerCase()}</Badge><h3 className="mt-2 text-lg font-bold"><Link href={`/community/${g.slug}`} className="hover:underline">{g.name}</Link></h3>
              <p className="mt-1 line-clamp-3 text-sm text-ink-soft">{g.description}</p><p className="mt-2 text-xs text-ink-soft">{g._count.members} member{g._count.members === 1 ? "" : "s"} · {g._count.posts} post{g._count.posts === 1 ? "" : "s"}</p></li>))}</ul>
            : <p className="card p-8 text-center text-sm text-ink-soft">No groups match yet.{writer && " Start the first one."}</p>}
          {writer && (
            <section className="card h-fit p-5" aria-label="Create a group"><h2 className="text-lg">Start a group</h2>
              <ActionForm action={createGroup} reset submit="Create group" success="Group created" className="mt-3 space-y-3">
                <Field label="Name" name="name" required maxLength={80} />
                <Area label="What is it for?" name="description" required maxLength={500} />
                <label className="block text-sm font-semibold">Type<select name="kind" className={sel}><option value="INTEREST">Interest or topic</option><option value="PROJECT">Project team</option></select></label>
              </ActionForm></section>)}
        </div>
      </Block>
      <Community />
    </>
  );
}
