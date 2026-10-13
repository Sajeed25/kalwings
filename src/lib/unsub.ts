import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

/** Signed token so the email "turn off" link works without logging in, and can't be forged for other users. */
export const unsubToken = (userId: string) => createHmac("sha256", process.env.AUTH_SECRET ?? "").update(`unsub:${userId}`).digest("hex").slice(0, 32);

export function verifyUnsub(userId: string, token: string) {
  const a = Buffer.from(unsubToken(userId)), b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}
