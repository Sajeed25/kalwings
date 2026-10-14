import "server-only";
import { createHash, randomInt, timingSafeEqual } from "crypto";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { emailConfigured, sendEmail } from "@/lib/email";

const TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export { normaliseIdentifier } from "@/lib/identifier";

const hash = (id: string, code: string) => createHash("sha256").update(`${process.env.AUTH_SECRET}:${id}:${code}`).digest("hex");

/** Creates an OTP. Returns the code ONLY outside production (no SMS/email provider is wired yet). */
export async function issueOtp(identifier: string, ip: string): Promise<{ ok: boolean; devCode?: string; error?: string }> {
  if (!(await rateLimit(`otp-ip:${ip}`, 20, 60 * 60 * 1000))) return { ok: false, error: "Too many requests. Try again later." };
  const recent = await db.otpCode.count({ where: { identifier, createdAt: { gt: new Date(Date.now() - 60 * 60 * 1000) } } });
  if (recent >= 5) return { ok: false, error: "Too many codes requested. Try again in an hour." };
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await db.otpCode.create({ data: { identifier, codeHash: hash(identifier, code), expiresAt: new Date(Date.now() + TTL_MS) } });
  if (process.env.NODE_ENV !== "production") {
    console.log(`[dev] OTP for ${identifier}: ${code}`);
    return { ok: true, devCode: code };
  }
  // Production: deliver by email. SMS has no provider wired yet, so mobile sign-in is unavailable.
  const fail = async (error: string) => { await db.otpCode.deleteMany({ where: { identifier, codeHash: hash(identifier, code) } }); return { ok: false, error }; };
  if (!identifier.includes("@")) return fail("Mobile sign-in isn't available yet. Please use your email address.");
  if (!emailConfigured()) return fail("Sign-in email isn't configured. Please contact support.");
  try {
    await sendEmail({ to: identifier, subject: "Your Kalwings sign-in code", text: `Your Kalwings code is ${code}. It expires in 10 minutes. If you didn't request it, ignore this email.` });
  } catch (e) {
    console.error(`[email] sign-in code was not sent: ${e instanceof Error ? e.message : e}`);
    return fail("We couldn't send the email. Please try again shortly.");
  }
  return { ok: true };
}

export async function verifyOtp(identifier: string, code: string): Promise<boolean> {
  const rec = await db.otpCode.findFirst({ where: { identifier, expiresAt: { gt: new Date() } }, orderBy: { createdAt: "desc" } });
  if (!rec || rec.attempts >= MAX_ATTEMPTS) return false;
  await db.otpCode.update({ where: { id: rec.id }, data: { attempts: { increment: 1 } } });
  const a = Buffer.from(rec.codeHash), b = Buffer.from(hash(identifier, code));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  await db.otpCode.deleteMany({ where: { identifier } });
  return true;
}
