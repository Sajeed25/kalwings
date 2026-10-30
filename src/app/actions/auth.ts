"use server";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { identifierSchema, otpSchema } from "@/lib/validation";
import { issueOtp, normaliseIdentifier, verifyOtp } from "@/lib/otp";
import { createSession, destroySession } from "@/lib/session";
import { clientIp } from "@/lib/request";
import { uniqueSlug } from "@/lib/slug";
import { rateLimit } from "@/lib/rate-limit";
import { maybePromoteAdmin } from "@/lib/admin-bootstrap";
import { safeNext } from "@/lib/next-path";
import { signupClosedMessage } from "@/lib/settings";
import { PASSWORD_MAX, fakeVerify, verifyPassword } from "@/lib/password";

const DOWN = "We're having trouble connecting right now. Please try again in a few minutes.";

export type AuthState = { step: "identify" | "code"; identifier?: string; devCode?: string; role?: string; name?: string; error?: string; mode: "join" | "login" };

export async function requestOtp(prev: AuthState, fd: FormData): Promise<AuthState> {
  const parsed = identifierSchema.safeParse({ identifier: fd.get("identifier") });
  const id = parsed.success ? normaliseIdentifier(parsed.data.identifier) : null;
  if (!id) return { ...prev, step: "identify", error: "Enter a valid email address." };
  let r: Awaited<ReturnType<typeof issueOtp>>;
  try {
    if (prev.mode === "join" && !(await db.user.findUnique({ where: { email: id.value }, select: { id: true } }))) {
      const closed = await signupClosedMessage(String(fd.get("role") ?? "STUDENT")); // fail before emailing a code
      if (closed) return { ...prev, step: "identify", error: closed };
    }
    r = await issueOtp(id.value, await clientIp());
  } catch (e) {
    console.error("[auth] requestOtp failed:", e instanceof Error ? e.message : e);
    return { ...prev, step: "identify", error: DOWN };
  }
  if (!r.ok) return { ...prev, step: "identify", error: r.error };
  return { ...prev, step: "code", identifier: id.value, devCode: r.devCode, role: String(fd.get("role") ?? "STUDENT"), error: undefined };
}

export async function submitOtp(prev: AuthState, fd: FormData): Promise<AuthState> {
  const parsed = otpSchema.safeParse({ identifier: fd.get("identifier"), code: fd.get("code"), name: fd.get("name") || undefined, role: fd.get("role") || undefined });
  const typedName = String(fd.get("name") ?? "");
  if (!parsed.success) return { ...prev, name: typedName, error: parsed.error.issues[0].message };
  const { identifier, code, name, role } = parsed.data;
  let dest = "/dashboard";
  try {
    if (!(await rateLimit(`verify:${identifier}`, 10, 15 * 60 * 1000))) return { ...prev, name: typedName, error: "Too many attempts. Try again later." };
    if (!(await verifyOtp(identifier, code))) return { ...prev, name: typedName, error: "That code is invalid or expired." };

    const isEmail = identifier.includes("@");
    let user = await db.user.findUnique({ where: isEmail ? { email: identifier } : { phone: identifier } });
    if (!user) {
      if (prev.mode === "login") return { ...prev, step: "identify", error: "No account found. Join Kalwings first." };
      const r = (role ?? "STUDENT") as Exclude<Role, "PLATFORM_ADMIN">;
      const closed = await signupClosedMessage(r);
      if (closed) return { ...prev, step: "identify", error: closed };
      user = await db.user.create({
        data: {
          name: name?.trim() || identifier.split("@")[0],
          role: r,
          ...(isEmail ? { email: identifier } : { phone: identifier }),
          ...(r === "STUDENT" ? { student: { create: { slug: uniqueSlug(name || "student") } } } : {}),
        },
      });
    }
    if (user.suspendedAt) return { ...prev, step: "identify", error: "This account has been suspended. Please contact support." };
    user = await maybePromoteAdmin(user);
    await createSession(user.id);
    const next = safeNext(fd.get("next"));
    dest = user.role === "STUDENT" && prev.mode === "join" ? `/dashboard/onboarding${next ? `?next=${encodeURIComponent(next)}` : ""}` : next ?? "/dashboard";
  } catch (e) {
    console.error("[auth] submitOtp failed:", e instanceof Error ? e.message : e);
    return { ...prev, name: typedName, error: DOWN };
  }
  redirect(dest); // outside the try: redirect() works by throwing
}

/** Password login for people who set a password in Account. Email codes keep working for everyone. */
export async function loginWithPassword(prev: AuthState, fd: FormData): Promise<AuthState> {
  const id = normaliseIdentifier(String(fd.get("identifier") ?? ""));
  const pw = String(fd.get("password") ?? "");
  const wrong: AuthState = { ...prev, step: "identify", error: "Incorrect email or password." };
  if (!id || !pw || pw.length > PASSWORD_MAX) return wrong;
  const dest = safeNext(fd.get("next")) ?? "/dashboard";
  try {
    if (!(await rateLimit(`pw-ip:${await clientIp()}`, 30, 60 * 60 * 1000))) return { ...prev, step: "identify", error: "Too many attempts. Try again later, or use an email code." };
    if (!(await rateLimit(`pw:${id.value}`, 8, 15 * 60 * 1000))) return { ...prev, step: "identify", error: "Too many attempts for this account. Wait 15 minutes, or log in with an email code." };
    let user = await db.user.findUnique({ where: id.kind === "email" ? { email: id.value } : { phone: id.value } });
    if (!user?.passwordHash) { await fakeVerify(pw); return wrong; } // same message and similar timing whether or not the account exists
    if (!(await verifyPassword(pw, user.passwordHash))) return wrong;
    if (user.suspendedAt) return { ...prev, step: "identify", error: "This account has been suspended. Please contact support." };
    user = await maybePromoteAdmin(user);
    await createSession(user.id, "password");
  } catch (e) {
    console.error("[auth] loginWithPassword failed:", e instanceof Error ? e.message : e);
    return { ...prev, step: "identify", error: DOWN };
  }
  redirect(dest);
}

export async function logout() {
  await destroySession();
  redirect("/");
}
