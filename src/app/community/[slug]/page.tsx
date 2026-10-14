import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getUser } from "@/lib/session";
import { Block } from "@/components/pages/shell";
import { Badge } from "@/components/ui/badge";
import { ActionButton, ActionForm, Area, Field } from "@/components/dash/action-form";
import { PostCard, POST_KIND } from "@/components/community/post-card";
import { archiveGroup, createPost, joinGroup, leaveGroup } from "@/app/actions/community";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Community group", robots: { index: false, follow: false } };
const PAGE = 15;
const sel = "mt-1.5 h-11 w-full rounded-lg border border-line bg-surface px-3 text-[15px]";

export default async function Page({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ kind?: string; page?: string }> }) {
  const { slug } = await params; const sp = await searchParams;
  const me = await getUser();
  if (!me) redirect("/login"); // posts are only visible to signed-in members of the platform
  const g = await db.group.findUnique({ where: { slug }, include: { _count: { select: { members: true } } } });
  if (!g || (g.archivedAt && me.role !== "PLATFORM_ADMIN")) notFound();
  const mem = await db.groupMember.findUnique({ where: { groupId_userId: { groupId: g.id, userId: me.id } } });
  if (g.kind === "COLLEGE" && !mem && me.role !== "PLATFORM_ADMIN") notFound(); // college communities are members-only
  const isMod = mem?.role === "MOD" || me.role === "PLATFORM_ADMIN";
  const writer = me.role === "STUDENT" || me.role === "MENTOR";
  const blocked = (await db.block.findMany({ where: { blockerId: me.id }, select: { blockedId: true } })).map((b) => b.blockedId);
  const kind = sp.kind && sp.kind in POST_KIND ? (sp.kind as keyof typeof POST_KIND) : undefined;
  const page = Math.max(1, Number(sp.page) || 1);
  const where = { groupId: g.id, ...(kind ? { kind } : {}), ...(isMod ? {} : { hiddenAt: null }), author: { suspendedAt: null }, authorId: { notIn: blocked } };
  const [posts, total] = await Promise.all([
    db.post.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE, take: PAGE, include: { author: { select: { id: true, name: true, role: true } }, comments: { where: { author: { suspendedAt: null }, authorId: { notIn: blocked }, ...(isMod ? {} : { hiddenAt: null }) }, orderBy: { createdAt: "asc" }, take: 100, include: { author: { select: { id: true, name: true, role: true } } } } } }),
    db.post.count({ where }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const q = (extra: Record<string, string>) => `?${new URLSearchParams({ ...(kind ? { kind } : {}), ...extra }).toString()}`;
  return (
    <Block>
      <Link href="/community" className="text-sm font-semibold text-accent">← All groups</Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div><div className="flex flex-wrap gap-2"><Badge tone="accent">{g.kind.toLowerCase()}</Badge>{g.archivedAt && <Badge tone="spot">Archived</Badge>}</div>
          <h1 className="mt-2 text-3xl font-semibold md:text-4xl">{g.name}</h1><p className="mt-1 max-w-2xl text-ink-soft">{g.description}</p><p className="mt-1 text-sm text-ink-soft">{g._count.members} member{g._count.members === 1 ? "" : "s"}</p></div>
        <div className="flex flex-wrap gap-2">
          {writer && g.kind !== "COLLEGE" && !g.archivedAt && (mem ? <ActionButton confirm="Leave this group?" action={leaveGroup.bind(null, g.id)}>Leave</ActionButton> : <ActionButton variant="primary" action={joinGroup.bind(null, g.id)}>Join group</ActionButton>)}
          {me.role === "PLATFORM_ADMIN" && <ActionButton action={archiveGroup.bind(null, g.id, !g.archivedAt)}>{g.archivedAt ? "Restore group" : "Archive group"}</ActionButton>}
        </div>
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div>
          <nav aria-label="Filter posts" className="mb-4 flex flex-wrap gap-2 text-sm">
            <Link href={`/community/${slug}`} className={`rounded-lg border px-3 py-1.5 ${!kind ? "border-accent text-accent" : "border-line"}`}>All</Link>
            {Object.entries(POST_KIND).map(([k, l]) => <Link key={k} href={`/community/${slug}?kind=${k}`} className={`rounded-lg border px-3 py-1.5 ${kind === k ? "border-accent text-accent" : "border-line"}`}>{l}</Link>)}
          </nav>
          {posts.length ? <ul className="space-y-4">{posts.map((p) => <li key={p.id}><PostCard p={p} me={me} canMod={isMod} /></li>)}</ul> : <p className="card p-8 text-center text-sm text-ink-soft">Nothing here yet. {mem ? "Start the first discussion." : "Join the group to start one."}</p>}
          {pages > 1 && <nav aria-label="Pagination" className="mt-6 flex justify-between text-sm">{page > 1 ? <Link className="rounded-lg border border-line px-4 py-2 font-semibold" href={q({ page: String(page - 1) })}>← Newer</Link> : <span />}{page < pages ? <Link className="rounded-lg border border-line px-4 py-2 font-semibold" href={q({ page: String(page + 1) })}>Older →</Link> : <span />}</nav>}
        </div>
        <aside className="space-y-4">
          {mem && !g.archivedAt ? (
            <section className="card p-5" aria-label="New post"><h2 className="text-lg">Start a post</h2>
              <ActionForm action={createPost} reset submit="Post" success="Posted" className="mt-3 space-y-3">
                <input type="hidden" name="groupId" value={g.id} />
                <label className="block text-sm font-semibold">Type<select name="kind" className={sel}>{Object.entries(POST_KIND).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
                <Field label="Title" name="title" required maxLength={140} />
                <Area label="Details" name="body" required maxLength={3000} />
                <Field label="Skills or topics (comma-separated)" name="tags" maxLength={200} hint="Helps people find teammates." />
                <Field label="Event date and time (IST, events only)" name="eventAt" type="datetime-local" />
              </ActionForm></section>
          ) : <p className="card p-5 text-sm text-ink-soft">{writer ? "Join this group to post and comment." : "Only students and mentors can post. You can read and report."}</p>}
          <p className="text-xs text-ink-soft">Posts are newest-first with no likes or ranking. Be useful and respectful: harassment, spam and fake opportunities are removed. Report anything wrong.</p>
        </aside>
      </div>
    </Block>
  );
}
