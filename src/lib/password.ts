import { randomBytes, scrypt, timingSafeEqual } from "crypto";

/**
 * Password hashing with Node's built-in scrypt (no extra dependency).
 * Format: scrypt$N$r$p$saltHex$hashHex. Parameters are stored with each hash so they can be raised later.
 * N=2^15, r=8 uses about 32 MiB per hash, so callers must rate-limit attempts (login does).
 */
const N = 1 << 15, R = 8, P = 1, KEYLEN = 64, MAXMEM = 128 * 1024 * 1024;
export const PASSWORD_MIN = 10, PASSWORD_MAX = 128;

const derive = (pw: string, salt: Buffer, n: number, r: number, p: number, len: number) =>
  new Promise<Buffer>((res, rej) => scrypt(pw.normalize("NFKC"), salt, len, { N: n, r, p, maxmem: MAXMEM }, (e, k) => (e ? rej(e) : res(k))));

export async function hashPassword(pw: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(pw, salt, N, R, P, KEYLEN);
  return `scrypt$${N}$${R}$${P}$${salt.toString("hex")}$${key.toString("hex")}`;
}

/** Constant-time check. Returns false (never throws) for malformed hashes. */
export async function verifyPassword(pw: string, stored: string): Promise<boolean> {
  const [alg, n, r, p, saltHex, hashHex] = stored.split("$");
  if (alg !== "scrypt" || !saltHex || !hashHex) return false;
  try {
    const expected = Buffer.from(hashHex, "hex");
    const got = await derive(pw, Buffer.from(saltHex, "hex"), Number(n), Number(r), Number(p), expected.length);
    return got.length === expected.length && timingSafeEqual(got, expected);
  } catch { return false; }
}

let dummy: Promise<string> | null = null;
/** Burn the same time as a real check when the account doesn't exist, so response time doesn't reveal which emails are registered. */
export async function fakeVerify(pw: string) { dummy ??= hashPassword("not-a-real-password"); await verifyPassword(pw, await dummy); }

const COMMON = new Set(["password", "password1", "password12", "password123", "1234567890", "12345678910", "qwertyuiop", "qwerty12345", "iloveyou123", "welcome123", "welcome1234", "letmein1234", "admin12345", "kalwings123", "kalwings1234", "abcdefghij", "0123456789", "9876543210", "passw0rd123", "changeme123"]);

/** Returns an error message, or null when the password is acceptable. Length matters more than symbols, so we ask for length only. */
export function passwordProblem(pw: string, ctx: { email?: string | null; name?: string }): string | null {
  if (pw.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters.`;
  if (pw.length > PASSWORD_MAX) return `Use at most ${PASSWORD_MAX} characters.`;
  const low = pw.toLowerCase();
  if (COMMON.has(low) || /^(.)\1+$/.test(pw)) return "That password is too easy to guess. Try a longer phrase.";
  const local = ctx.email?.split("@")[0]?.toLowerCase();
  if (local && local.length >= 4 && low.includes(local)) return "Don't use your email name in your password.";
  const first = ctx.name?.trim().split(/\s+/)[0]?.toLowerCase();
  if (first && first.length >= 4 && low === first.repeat(Math.ceil(10 / first.length))) return "That password is too easy to guess.";
  return null;
}
