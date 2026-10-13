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

const DOWN = "We're having trouble connecting right now. Please try again in a few minutes.";

export type AuthState = { step: "identify" | "code"; identifier?: string; devCode?: string; role?: string; name?: string; error?: string; mode: "join" | "login" };

export async function requestOtp(prev: AuthState, fd: FormData): Promise<AuthState> {
  const parsed = identifierSchema.safeParse({ identifier: fd.get("identifier") });
  const id = parsed.success ? normaliseIdentifier(parsed.data.identifier) : null;
  if (!id) return { ...prev, step: "identify", error: "Enter a valid email or 10-digit mobile number." };
  let r: Awaited<ReturnType<typeof issueOtp>>;
  try {
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
      user = await db.user.create({
        data: {
          name: name?.trim() || identifier.split("@")[0],
          role: r,
          ...(isEmail ? { email: identifier } : { phone: identifier }),
          ...(r === "STUDENT" ? { student: { create: { slug: uniqueSlug(name || "student") } } } : {}),
        },
      });
    }
    user = await maybePromoteAdmin(user);
    await createSession(user.id);
    dest = user.role === "STUDENT" && prev.mode === "join" ? "/dashboard/onboarding" : "/dashboard";
  } catch (e) {
    console.error("[auth] submitOtp failed:", e instanceof Error ? e.message : e);
    return { ...prev, name: typedName, error: DOWN };
  }
  redirect(dest); // outside the try: redirect() works by throwing
}

export async function logout() {
  await destroySession();
  redirect("/");
}
