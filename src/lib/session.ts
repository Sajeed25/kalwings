import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@prisma/client";
import { db } from "@/lib/db";

const COOKIE = "kw_session";
const MAX_AGE = 60 * 60 * 24 * 14;

function key() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET must be set (32+ chars)");
  return new TextEncoder().encode(s);
}

export async function createSession(userId: string) {
  const token = await new SignJWT({}).setProtectedHeader({ alg: "HS256" }).setSubject(userId).setIssuedAt().setExpirationTime(`${MAX_AGE}s`).sign(key());
  (await cookies()).set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: MAX_AGE });
  // Non-sensitive UI hint only (lets static pages show "Dashboard"). Never used for authorisation.
  (await cookies()).set("kw_in", "1", { sameSite: "lax", path: "/", maxAge: MAX_AGE });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
  (await cookies()).delete("kw_in");
}

/** Current user (fresh from DB so role changes apply immediately), or null. */
export async function getUser() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    if (!payload.sub) return null;
    return await db.user.findUnique({ where: { id: payload.sub } });
  } catch {
    return null;
  }
}

export type SessionUser = NonNullable<Awaited<ReturnType<typeof getUser>>>;

/** For pages: redirect to login when signed out or wrong role. */
export async function requirePageRole(...roles: Role[]): Promise<SessionUser> {
  const u = await getUser();
  if (!u) redirect("/login");
  if (roles.length && !roles.includes(u.role)) redirect("/dashboard");
  return u;
}

/** For server actions: throws instead of redirecting. Call this in EVERY action. */
export async function requireActionRole(...roles: Role[]): Promise<SessionUser> {
  const u = await getUser();
  if (!u) throw new Error("Not signed in");
  if (roles.length && !roles.includes(u.role)) throw new Error("Forbidden");
  return u;
}
