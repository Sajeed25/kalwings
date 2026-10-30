import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUser } from "@/lib/session";
import { assertSameOrigin } from "@/lib/request";
import { rateLimit } from "@/lib/rate-limit";

const CHUNK_BYTES = 500_000;
const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

/**
 * POST /api/upload/chunk?token=<random>&i=<n>: one piece (up to 500 KB) of a resume or intro video. Students only. The pieces are joined by
 * /api/resume or /api/intro-video. Small pieces keep uploads working behind hosting proxies that limit request size.
 */
export async function POST(req: Request) {
  try { await assertSameOrigin(); } catch { return bad("Bad origin", 403); }
  const user = await getUser();
  if (!user) return bad("Please sign in", 401);
  if (user.role !== "STUDENT") return bad("Only students can upload a resume or video", 403);
  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? "", idx = Number(url.searchParams.get("i"));
  if (!/^[A-Za-z0-9_-]{16,40}$/.test(token) || !Number.isInteger(idx) || idx < 0 || idx > 24) return bad("Invalid upload");
  if (!(await rateLimit(`chunk:${user.id}`, 400, 60 * 60 * 1000))) return bad("Too many uploads. Try again later.", 429);
  const body = new Uint8Array(await req.arrayBuffer());
  if (body.length === 0 || body.length > CHUNK_BYTES + 1000) return bad("Piece too large", 413);
  const mine = await db.uploadChunk.findFirst({ where: { token }, select: { userId: true } });
  if (mine && mine.userId !== user.id) return bad("Invalid upload", 403);
  await db.uploadChunk.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 2 * 60 * 60 * 1000) } } });
  await db.uploadChunk.upsert({ where: { token_idx: { token, idx } }, create: { token, userId: user.id, idx, data: Buffer.from(body) }, update: { data: Buffer.from(body) } });
  return NextResponse.json({ ok: true });
}
