import { NextResponse, type NextRequest } from "next/server";
import { randomBytes } from "crypto";
import { publicOrigin } from "@/lib/origin";

export function GET(req: NextRequest) {
  const id = process.env.GOOGLE_CLIENT_ID;
  if (!id || !process.env.GOOGLE_CLIENT_SECRET) return NextResponse.redirect(new URL("/login?error=google-not-configured", publicOrigin(req)));
  const state = randomBytes(16).toString("hex");
  const role = ["STUDENT", "MENTOR", "EMPLOYER", "COLLEGE_ADMIN"].includes(req.nextUrl.searchParams.get("role") ?? "") ? req.nextUrl.searchParams.get("role")! : "STUDENT";
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({ client_id: id, redirect_uri: `${publicOrigin(req)}/api/auth/google/callback`, response_type: "code", scope: "openid email profile", state, prompt: "select_account" }).toString();
  const res = NextResponse.redirect(url);
  const opts = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 600 };
  res.cookies.set("kw_oauth_state", state, opts);
  res.cookies.set("kw_oauth_role", role, opts);
  return res;
}
