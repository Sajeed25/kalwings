import { NextResponse, type NextRequest } from "next/server";
import { decodeJwt } from "jose";
import type { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { createSession } from "@/lib/session";
import { uniqueSlug } from "@/lib/slug";
import { maybePromoteAdmin } from "@/lib/admin-bootstrap";

export async function GET(req: NextRequest) {
  const fail = (e: string) => NextResponse.redirect(new URL(`/login?error=${e}`, req.url));
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  if (!code || !state || state !== req.cookies.get("kw_oauth_state")?.value) return fail("google-state");

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: process.env.GOOGLE_CLIENT_ID!, client_secret: process.env.GOOGLE_CLIENT_SECRET!, redirect_uri: `${req.nextUrl.origin}/api/auth/google/callback`, grant_type: "authorization_code" }),
  });
  if (!tokenRes.ok) return fail("google-token");
  // id_token comes straight from Google's token endpoint over TLS, so decoding without a separate signature check is acceptable here.
  const claims = decodeJwt((await tokenRes.json()).id_token as string) as { sub: string; email?: string; email_verified?: boolean; name?: string };
  if (!claims.sub || !claims.email || !claims.email_verified) return fail("google-email");

  const email = claims.email.toLowerCase();
  let user = await db.user.findFirst({ where: { OR: [{ googleId: claims.sub }, { email }] } });
  if (user && !user.googleId) user = await db.user.update({ where: { id: user.id }, data: { googleId: claims.sub } });
  const isNew = !user;
  if (!user) {
    const role = (req.cookies.get("kw_oauth_role")?.value ?? "STUDENT") as Exclude<Role, "PLATFORM_ADMIN">;
    user = await db.user.create({ data: { email, googleId: claims.sub, name: claims.name ?? email.split("@")[0], role, ...(role === "STUDENT" ? { student: { create: { slug: uniqueSlug(claims.name ?? "student") } } } : {}) } });
  }
  if (user.suspendedAt) return fail("suspended");
  user = await maybePromoteAdmin(user);
  await createSession(user.id);
  const res = NextResponse.redirect(new URL(isNew && user.role === "STUDENT" ? "/dashboard/onboarding" : "/dashboard", req.url));
  res.cookies.delete("kw_oauth_state");
  res.cookies.delete("kw_oauth_role");
  return res;
}
