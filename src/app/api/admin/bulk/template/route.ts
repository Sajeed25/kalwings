import { getUser } from "@/lib/session";
import { SPECS, templateCsv, type BulkKind } from "@/lib/bulk";

/** GET ?kind=students|companies|mentors: a CSV template (opens in Excel). Platform admins only. */
export async function GET(req: Request) {
  const user = await getUser();
  if (!user || user.role !== "PLATFORM_ADMIN") return new Response("Not allowed", { status: 403 });
  const kind = new URL(req.url).searchParams.get("kind") as BulkKind;
  if (!(kind in SPECS)) return new Response("Unknown kind", { status: 400 });
  return new Response(templateCsv(kind), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="kalwings-${kind}-template.csv"`, "cache-control": "no-store" } });
}
