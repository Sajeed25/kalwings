import { NextResponse } from "next/server";
import { getUser } from "@/lib/session";
import { assertSameOrigin } from "@/lib/request";
import { rateLimit } from "@/lib/rate-limit";
import { audit } from "@/lib/audit";
import { readTable, runBulk, type BulkKind } from "@/lib/bulk";

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

/** POST multipart: kind=students|companies|mentors, file (.xlsx/.csv), mode=preview|import, [sendEmails=1]. Platform admins only. */
export async function POST(req: Request) {
  try { await assertSameOrigin(); } catch { return bad("Bad origin", 403); }
  const user = await getUser();
  if (!user) return bad("Please sign in", 401);
  if (user.role !== "PLATFORM_ADMIN") return bad("Not allowed", 403);
  if (!(await rateLimit(`bulk:${user.id}`, 60, 60 * 60 * 1000))) return bad("Too many uploads. Try again later.", 429);
  let form: FormData;
  try { form = await req.formData(); } catch { return bad("Invalid upload"); }
  const kind = String(form.get("kind") ?? "") as BulkKind;
  const file = form.get("file");
  if (!["students", "companies", "mentors"].includes(kind)) return bad("Choose what you are uploading");
  if (!(file instanceof File)) return bad("Choose a file");
  const commit = form.get("mode") === "import";
  let table: string[][];
  try { table = await readTable(file); } catch (e) { return bad(e instanceof Error ? e.message : "Could not read the file"); }
  const report = await runBulk(kind, table, { commit, sendEmails: commit && form.get("sendEmails") === "1" });
  if ("error" in report) return bad(report.error);
  if (commit) await audit(user.id, "bulk.import", `${kind}: ${report.counts.ok} added, ${report.counts.skipped} skipped, ${report.counts.error} errors (${file.name.slice(0, 60)})`.slice(0, 190));
  return NextResponse.json(report);
}
