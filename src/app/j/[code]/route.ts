import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cleanSource } from "@/lib/distribution-utils";

/** Short share link: /j/<code> opens the listing. ?src= and ?ref= are kept so employers can see where applicants came from and who referred them. */
export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const url = new URL(req.url);
  const o = /^[a-z0-9]{6,12}$/.test(code) ? await db.opportunity.findUnique({ where: { shortCode: code }, select: { id: true } }) : null;
  if (!o) return NextResponse.redirect(new URL("/opportunities", url.origin), 302);
  const dest = new URL(`/opportunities/${o.id}`, url.origin);
  const src = cleanSource(url.searchParams.get("src")); const ref = url.searchParams.get("ref");
  if (src) dest.searchParams.set("src", src);
  if (ref && /^[A-Za-z0-9_-]{1,40}$/.test(ref)) dest.searchParams.set("ref", ref);
  return NextResponse.redirect(dest, 302);
}
