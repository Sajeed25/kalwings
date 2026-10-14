import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUser } from "@/lib/session";
import { assertSameOrigin } from "@/lib/request";
import { rateLimit } from "@/lib/rate-limit";
import { MAX_IMAGE_BYTES, sniffImage } from "@/lib/image";

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

/**
 * POST multipart: file, kind=AVATAR|PROJECT|COMPANY_LOGO, [projectId].
 * Students: own avatar + screenshots of their own projects. Mentors: own avatar. Employers: their company logo. Everyone else: refused.
 */
export async function POST(req: Request) {
  try { await assertSameOrigin(); } catch { return bad("Bad origin", 403); }
  const user = await getUser();
  if (!user) return bad("Please sign in", 401);
  if (!(await rateLimit(`upload:${user.id}`, 20, 60 * 60 * 1000))) return bad("Too many uploads. Try again later.", 429);

  let form: FormData;
  try { form = await req.formData(); } catch { return bad("Invalid upload"); }
  const file = form.get("file");
  const kind = String(form.get("kind") ?? "");
  if (!(file instanceof File)) return bad("No file");
  if (kind !== "AVATAR" && kind !== "PROJECT" && kind !== "COMPANY_LOGO") return bad("Invalid kind");
  if (file.size === 0 || file.size > MAX_IMAGE_BYTES) return bad(`Image must be under ${MAX_IMAGE_BYTES / 1_000_000} MB`, 413);

  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = sniffImage(bytes);
  if (!mime) return bad("Only PNG, JPEG or WebP images are allowed");

  // Work out what this upload replaces, enforcing ownership.
  let apply: (uploadId: string) => Promise<string | null>; // returns the previous upload id to delete
  if (kind === "AVATAR" && user.role === "STUDENT") {
    const p = await db.studentProfile.findUnique({ where: { userId: user.id } });
    if (!p) return bad("No student profile", 404);
    apply = async (id) => { await db.studentProfile.update({ where: { id: p.id }, data: { avatarId: id } }); return p.avatarId; };
  } else if (kind === "AVATAR" && user.role === "MENTOR") {
    const m = await db.mentorProfile.findUnique({ where: { userId: user.id } });
    if (!m) return bad("Create your mentor profile first", 400);
    apply = async (id) => { await db.mentorProfile.update({ where: { id: m.id }, data: { avatarId: id } }); return m.avatarId; };
  } else if (kind === "COMPANY_LOGO" && user.role === "EMPLOYER") {
    const mem = await db.employerMember.findUnique({ where: { userId: user.id }, include: { company: true } });
    if (!mem) return bad("Create your company first", 400);
    const c = mem.company;
    apply = async (id) => { await db.company.update({ where: { id: c.id }, data: { logoId: id } }); return c.logoId; };
  } else if (kind === "PROJECT" && user.role === "STUDENT") {
    const projectId = String(form.get("projectId") ?? "");
    const proj = await db.project.findFirst({ where: { id: projectId, student: { userId: user.id } } });
    if (!proj) return bad("Project not found", 404);
    apply = async (id) => { await db.project.update({ where: { id: proj.id }, data: { imageId: id } }); return proj.imageId; };
  } else {
    return bad("Not allowed", 403);
  }

  const up = await db.upload.create({ data: { ownerId: user.id, kind, mime, size: bytes.length, data: Buffer.from(bytes) }, select: { id: true } });
  const previous = await apply(up.id);
  if (previous) await db.upload.deleteMany({ where: { id: previous, ownerId: user.id } }); // never delete someone else's file (a teammate's old logo simply stays)
  return NextResponse.json({ id: up.id, url: `/api/files/${up.id}` });
}
