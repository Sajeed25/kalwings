"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireActionRole } from "@/lib/session";
import { groupSchema, postSchema, commentSchema, csv } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import { audit } from "@/lib/audit";
import { slugify } from "@/lib/slug";
import { randomBytes } from "crypto";
import { fail, obj, type Result } from "./_shared";

const writer = () => requireActionRole("STUDENT", "MENTOR"); // recruiters and admins can read, not post, to keep it peer-to-peer
const touch = (slug?: string) => { revalidatePath("/community"); if (slug) revalidatePath(`/community/${slug}`); };

async function membership(groupId: string, userId: string) {
  return db.groupMember.findUnique({ where: { groupId_userId: { groupId, userId } }, include: { group: true } });
}

export async function createGroup(_: Result, fd: FormData): Promise<Result> {
  const u = await writer();
  const r = groupSchema.safeParse(obj(fd));
  if (!r.success) return fail(r.error);
  if (!(await rateLimit(`group-create:${u.id}`, 5, 24 * 60 * 60 * 1000))) return { error: "You can create up to 5 groups a day." };
  if ((await db.group.count({ where: { createdById: u.id, archivedAt: null } })) >= 5) return { error: "You already run 5 groups." };
  const slug = `${slugify(r.data.name).slice(0, 40)}-${randomBytes(2).toString("hex")}`;
  await db.group.create({ data: { slug, name: r.data.name, description: r.data.description, kind: r.data.kind, createdById: u.id, members: { create: { userId: u.id, role: "MOD" } } } });
  touch();
  return { ok: true };
}

/** A student's college community: created on first use, joinable only by students who selected that verified college. */
export async function joinCollegeGroup() {
  const u = await requireActionRole("STUDENT");
  const sp = await db.studentProfile.findUnique({ where: { userId: u.id }, include: { college: true } });
  if (!sp?.college || sp.college.status !== "VERIFIED") throw new Error("Pick a verified college in your profile first.");
  let g = await db.group.findFirst({ where: { kind: "COLLEGE", collegeId: sp.college.id } });
  if (!g) g = await db.group.create({ data: { slug: `college-${slugify(sp.college.name).slice(0, 40)}-${randomBytes(2).toString("hex")}`, name: `${sp.college.name} community`, description: `Students of ${sp.college.name}: study groups, project calls and events.`, kind: "COLLEGE", collegeId: sp.college.id, createdById: u.id } });
  if (g.archivedAt) throw new Error("This group is archived.");
  await db.groupMember.upsert({ where: { groupId_userId: { groupId: g.id, userId: u.id } }, create: { groupId: g.id, userId: u.id, role: "MEMBER" }, update: {} });
  touch(g.slug);
}

export async function joinGroup(groupId: string) {
  const u = await writer();
  const g = await db.group.findUnique({ where: { id: groupId } });
  if (!g || g.archivedAt) throw new Error("Group not found");
  if (g.kind === "COLLEGE") throw new Error("Join your college community from the Community page.");
  await db.groupMember.upsert({ where: { groupId_userId: { groupId, userId: u.id } }, create: { groupId, userId: u.id, role: "MEMBER" }, update: {} });
  touch(g.slug);
}

export async function leaveGroup(groupId: string) {
  const u = await writer();
  const m = await membership(groupId, u.id);
  if (!m) return;
  await db.groupMember.delete({ where: { groupId_userId: { groupId, userId: u.id } } });
  touch(m.group.slug);
}

export async function createPost(_: Result, fd: FormData): Promise<Result> {
  const u = await writer();
  const r = postSchema.safeParse(obj(fd));
  if (!r.success) return fail(r.error);
  const m = await membership(r.data.groupId, u.id);
  if (!m || m.group.archivedAt) return { error: "Join the group to post." };
  if (r.data.kind === "EVENT" && (!r.data.eventAt || r.data.eventAt.getTime() < Date.now())) return { error: "Events need a future date and time.", fieldErrors: { eventAt: "Pick a future time" } };
  if (!(await rateLimit(`post:${u.id}`, 10, 60 * 60 * 1000))) return { error: "You're posting a lot. Try again in a while." };
  await db.post.create({ data: { groupId: m.groupId, authorId: u.id, kind: r.data.kind, title: r.data.title, body: r.data.body, tags: csv(r.data.tags), eventAt: r.data.kind === "EVENT" ? r.data.eventAt : null } });
  touch(m.group.slug);
  return { ok: true };
}

export async function createComment(_: Result, fd: FormData): Promise<Result> {
  const u = await writer();
  const r = commentSchema.safeParse(obj(fd));
  if (!r.success) return fail(r.error);
  const post = await db.post.findFirst({ where: { id: r.data.postId, hiddenAt: null }, include: { group: true } });
  if (!post || post.group.archivedAt || !(await membership(post.groupId, u.id))) return { error: "Join the group to comment." };
  if (!(await rateLimit(`comment:${u.id}`, 30, 60 * 60 * 1000))) return { error: "Slow down a little." };
  await db.comment.create({ data: { postId: post.id, authorId: u.id, body: r.data.body } });
  touch(post.group.slug);
  return { ok: true };
}

async function targetOf(type: "POST" | "COMMENT", id: string) {
  if (type === "POST") { const p = await db.post.findUnique({ where: { id }, include: { group: true } }); return p ? { authorId: p.authorId, groupId: p.groupId, slug: p.group.slug } : null; }
  const c = await db.comment.findUnique({ where: { id }, include: { post: { include: { group: true } } } });
  return c ? { authorId: c.authorId, groupId: c.post.groupId, slug: c.post.group.slug } : null;
}

/** Hide or restore content: group moderators for their group, platform admins everywhere. */
export async function setHidden(type: "POST" | "COMMENT", id: string, hidden: boolean) {
  const u = await requireActionRole("STUDENT", "MENTOR", "PLATFORM_ADMIN");
  const t = await targetOf(type, id);
  if (!t) return;
  const m = await membership(t.groupId, u.id);
  if (u.role !== "PLATFORM_ADMIN" && m?.role !== "MOD") throw new Error("Forbidden");
  const data = { hiddenAt: hidden ? new Date() : null };
  if (type === "POST") await db.post.update({ where: { id }, data }); else await db.comment.update({ where: { id }, data });
  await audit(u.id, `community.${hidden ? "hide" : "unhide"}_${type.toLowerCase()}`, id);
  touch(t.slug);
}

export async function deleteOwnContent(type: "POST" | "COMMENT", id: string) {
  const u = await writer();
  const t = await targetOf(type, id);
  if (!t || t.authorId !== u.id) return;
  if (type === "POST") await db.post.delete({ where: { id } }); else await db.comment.delete({ where: { id } });
  touch(t.slug);
}

export async function blockUser(userId: string) {
  const u = await requireActionRole("STUDENT", "MENTOR");
  if (userId === u.id) return;
  if (!(await db.user.findUnique({ where: { id: userId }, select: { id: true } }))) return;
  await db.block.upsert({ where: { blockerId_blockedId: { blockerId: u.id, blockedId: userId } }, create: { blockerId: u.id, blockedId: userId }, update: {} });
  revalidatePath("/community", "layout");
}

export async function unblockUser(userId: string) {
  const u = await requireActionRole("STUDENT", "MENTOR");
  await db.block.deleteMany({ where: { blockerId: u.id, blockedId: userId } });
  revalidatePath("/community", "layout");
}

export async function archiveGroup(groupId: string, archived: boolean) {
  const a = await requireActionRole("PLATFORM_ADMIN");
  const g = await db.group.update({ where: { id: groupId }, data: { archivedAt: archived ? new Date() : null } });
  await audit(a.id, `community.${archived ? "archive" : "restore"}_group`, `${g.name} (${g.id})`);
  touch(g.slug);
}
