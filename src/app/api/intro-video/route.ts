import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUser } from "@/lib/session";
import { assertSameOrigin } from "@/lib/request";
import { rateLimit } from "@/lib/rate-limit";
import { takeChunks } from "@/lib/assemble";
import { liveProfileScore } from "@/lib/profile-score";
import { MAX_VIDEO_BYTES, sniffVideo } from "@/lib/files";

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

/**
 * POST JSON { token, count }: finishes an intro-video upload. Only students whose profile is 100% complete can record one: it keeps storage
 * for people who are serious about applying and gives employers a complete picture.
 */
export async function POST(req: Request) {
  try { await assertSameOrigin(); } catch { return bad("Bad origin", 403); }
  const user = await getUser();
  if (!user) return bad("Please sign in", 401);
  if (user.role !== "STUDENT") return bad("Only students can add an intro video", 403);
  const p = await db.studentProfile.findUnique({ where: { userId: user.id }, select: { id: true, introVideoId: true } });
  if (!p) return bad("No student profile", 404);
  const { score } = await liveProfileScore(p.id);
  if (score < 100) return bad(`Your profile is ${score}% complete. Reach 100% to unlock the intro video.`, 403);
  if (!(await rateLimit(`intro:${user.id}`, 8, 60 * 60 * 1000))) return bad("Too many uploads. Try again later.", 429);
  const j = (await req.json().catch(() => null)) as { token?: string; count?: number } | null;
  if (!j) return bad("Invalid upload");
  const bytes = await takeChunks(user.id, String(j.token ?? ""), Number(j.count), MAX_VIDEO_BYTES);
  if (!bytes) return bad(`The video must be under ${MAX_VIDEO_BYTES / 1_000_000} MB. Record a shorter one and try again.`, 413);
  const mime = sniffVideo(bytes);
  if (!mime) return bad("That recording could not be read. Please record again.", 415);
  const up = await db.upload.create({ data: { ownerId: user.id, kind: "INTRO_VIDEO", name: "intro-video", mime, size: bytes.length, data: new Uint8Array(bytes) }, select: { id: true } });
  await db.studentProfile.update({ where: { id: p.id }, data: { introVideoId: up.id, introVideoAt: new Date() } });
  if (p.introVideoId && !(await db.application.count({ where: { introVideoId: p.introVideoId } }))) await db.upload.deleteMany({ where: { id: p.introVideoId, ownerId: user.id } });
  return NextResponse.json({ ok: true });
}
