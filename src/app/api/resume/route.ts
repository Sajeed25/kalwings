import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUser } from "@/lib/session";
import { assertSameOrigin } from "@/lib/request";
import { rateLimit } from "@/lib/rate-limit";
import { takeChunks } from "@/lib/assemble";
import { MAX_RESUME_BYTES, RESUME_FORMATS, safeFileName, sniffResume } from "@/lib/files";

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

/** POST JSON { token, count, name }: finishes a resume upload started with /api/upload/chunk. PDF, DOC, DOCX or RTF, up to 2 MB. Students only. */
export async function POST(req: Request) {
  try { await assertSameOrigin(); } catch { return bad("Bad origin", 403); }
  const user = await getUser();
  if (!user) return bad("Please sign in", 401);
  if (user.role !== "STUDENT") return bad("Only students can add a resume", 403);
  if (!(await rateLimit(`resume:${user.id}`, 12, 60 * 60 * 1000))) return bad("Too many uploads. Try again later.", 429);
  const j = (await req.json().catch(() => null)) as { token?: string; count?: number; name?: string } | null;
  if (!j) return bad("Invalid upload");
  const bytes = await takeChunks(user.id, String(j.token ?? ""), Number(j.count), MAX_RESUME_BYTES);
  if (!bytes) return bad(`Your resume must be a file of ${RESUME_FORMATS} under ${MAX_RESUME_BYTES / 1_000_000} MB. Try again.`, 413);
  const kind = sniffResume(bytes);
  if (!kind) return bad(`That file isn't a safe ${RESUME_FORMATS} resume. Save it again as PDF or DOCX (no macros or embedded files) and retry.`, 415);
  const name = safeFileName(String(j.name ?? ""), kind.ext);
  const p = await db.studentProfile.findUnique({ where: { userId: user.id }, select: { id: true, resumeId: true } });
  if (!p) return bad("No student profile", 404);
  const up = await db.upload.create({ data: { ownerId: user.id, kind: "RESUME", name, mime: kind.mime, size: bytes.length, data: new Uint8Array(bytes) }, select: { id: true } });
  await db.studentProfile.update({ where: { id: p.id }, data: { resumeId: up.id, resumeName: name } });
  // The old file is deleted unless an application already carries it (employers who received it keep what they were sent)
  if (p.resumeId && !(await db.application.count({ where: { resumeId: p.resumeId } }))) await db.upload.deleteMany({ where: { id: p.resumeId, ownerId: user.id } });
  return NextResponse.json({ ok: true, name });
}
