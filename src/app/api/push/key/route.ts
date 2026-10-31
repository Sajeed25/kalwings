import { NextResponse } from "next/server";
import { getUser } from "@/lib/session";
import { vapid } from "@/lib/vapid";

/** The public key a browser needs to subscribe. Signed-in people only. */
export async function GET() {
  if (!(await getUser())) return NextResponse.json({ error: "Please sign in" }, { status: 401 });
  try { return NextResponse.json({ key: (await vapid()).publicKey }); } catch { return NextResponse.json({ error: "Push is unavailable right now" }, { status: 503 }); }
}
