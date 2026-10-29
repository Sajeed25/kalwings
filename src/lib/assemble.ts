import "server-only";
import { db } from "@/lib/db";

/** Joins the uploaded pieces for a token, in order. Returns null when a piece is missing or the total is over the cap. The pieces are deleted either way. */
export async function takeChunks(userId: string, token: string, count: number, maxBytes: number): Promise<Buffer | null> {
  if (!/^[A-Za-z0-9_-]{16,40}$/.test(token) || !Number.isInteger(count) || count < 1 || count > 25) return null;
  const rows = await db.uploadChunk.findMany({ where: { token, userId }, orderBy: { idx: "asc" } });
  await db.uploadChunk.deleteMany({ where: { token, userId } });
  if (rows.length !== count || rows.some((r, i) => r.idx !== i)) return null;
  const total = rows.reduce((n, r) => n + r.data.length, 0);
  if (total === 0 || total > maxBytes) return null;
  return Buffer.concat(rows.map((r) => r.data));
}
