import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getUser } from "@/lib/session";
import { Block, PageHero } from "@/components/pages/shell";
import { PostCard } from "@/components/community/post-card";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Find teammates", robots: { index: false, follow: false } };

export default async function Page({ searchParams }: { searchParams: Promise<{ skill?: string }> }) {
  const me = await getUser();
  if (!me) redirect("/login");
  const skill = (await searchParams).skill?.trim().toLowerCase().slice(0, 40);
  const blocked = (await db.block.findMany({ where: { blockerId: me.id }, select: { blockedId: true } })).map((b) => b.blockedId);
  const rows = await db.post.findMany({
    where: { kind: "PROJECT_CALL", hiddenAt: null, group: { archivedAt: null, kind: { not: "COLLEGE" } }, author: { suspendedAt: null }, authorId: { notIn: blocked } },
    orderBy: { createdAt: "desc" }, take: 100, include: { group: { select: { name: true, slug: true } }, author: { select: { id: true, name: true, role: true } }, comments: { where: { hiddenAt: null, author: { suspendedAt: null } }, orderBy: { createdAt: "asc" }, take: 50, include: { author: { select: { id: true, name: true, role: true } } } } },
  });
  const posts = rows.filter((p) => !skill || (Array.isArray(p.tags) ? (p.tags as string[]) : []).some((t) => String(t).toLowerCase().includes(skill))).slice(0, 30);
  return (
    <>
      <PageHero eyebrow="Community" title="Find teammates." lead="Project calls from open groups, newest first. Filter by the skill you can offer." />
      <Block>
        <form className="mb-6 flex max-w-md gap-2" role="search"><label className="sr-only" htmlFor="skill">Skill</label><input id="skill" name="skill" defaultValue={skill} placeholder="e.g. React, SQL, CAD" className="h-11 flex-1 rounded-lg border border-line bg-surface px-3" /><button className="h-11 rounded-lg bg-primary px-4 font-semibold text-white">Filter</button></form>
        {posts.length ? <ul className="grid gap-4 lg:grid-cols-2">{posts.map((p) => <li key={p.id}><PostCard p={p} me={me} canMod={me.role === "PLATFORM_ADMIN"} showGroup /></li>)}</ul> : <p className="card p-8 text-center text-sm text-ink-soft">No project calls match. <Link href="/community" className="underline">Browse groups</Link> and post one.</p>}
      </Block>
    </>
  );
}
