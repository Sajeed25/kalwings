import { NextResponse, type NextRequest } from "next/server";
import { decodeJwt } from "jose";
import type { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { createSession } from "@/lib/session";
import { uniqueSlug } from "@/lib/slug";
import { maybePromoteAdmin } from "@/lib/admin-bootstrap";
import { publicOrigin } from "@/lib/origin";

export async function GET(req: NextRequest) {
  const fail = (e: string) => NextResponse.redirect(new URL(`/login?error=${e}`, publicOrigin(req)));
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  if (!code || !state || state !== req.cookies.get("kw_oauth_state")?.value) {
    // Usually: sign-in started on a different host than the callback, cookies blocked, or the page was reloaded. No secrets are logged.
    console.error(`[google] state check failed: code=${!!code} state=${!!state} cookie=${!!req.cookies.get("kw_oauth_state")?.value} origin=${publicOrigin(req)}`);
    return fail("google-state");
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: process.env.GOOGLE_CLIENT_ID!, client_secret: process.env.GOOGLE_CLIENT_SECRET!, redirect_uri: `${publicOrigin(req)}/api/auth/google/callback`, grant_type: "authorization_code" }),
  });
  if (!tokenRes.ok) {
    // Google's error codes (e.g. invalid_client = wrong secret, redirect_uri_mismatch, invalid_grant = code reused/expired). Never log the secret.
    const body = (await tokenRes.json().catch(() => ({}))) as { error?: string; error_description?: string };
    console.error(`[google] token exchange failed: HTTP ${tokenRes.status} ${body.error ?? "?"} (${body.error_description ?? "no description"}) redirect_uri=${publicOrigin(req)}/api/auth/google/callback client_id=${(process.env.GOOGLE_CLIENT_ID ?? "").slice(0, 12)}…`);
    return fail("google-token");
  }
  // id_token comes straight from Google's token endpoint over TLS, so decoding without a separate signature check is acceptable here.
  const claims = decodeJwt((await tokenRes.json()).id_token as string) as { sub: string; email?: string; email_verified?: boolean; name?: string };
  if (!claims.sub || !claims.email || !claims.email_verified) { console.error(`[google] id_token missing a verified email (sub=${!!claims.sub} email=${!!claims.email} verified=${!!claims.email_verified})`); return fail("google-email"); }

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
  const res = NextResponse.redirect(new URL(isNew && user.role === "STUDENT" ? "/dashboard/onboarding" : "/dashboard", publicOrigin(req)));
  res.cookies.delete("kw_oauth_state");
  res.cookies.delete("kw_oauth_role");
  return res;
}
