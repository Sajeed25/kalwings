import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/session";
import { Empty, PageTitle, Panel, fmtTime } from "@/components/dash/ui";

export default async function Page() {
  await requirePageRole("PLATFORM_ADMIN");
  const rows = await db.errorLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <>
      <PageTitle title="Server errors" sub="Unhandled errors from the last requests. No personal data is stored." />
      <Panel>{rows.length ? <ul className="divide-y divide-line text-sm">{rows.map((e) => (
        <li key={e.id} className="py-3"><p className="font-semibold">{e.message}</p><p className="text-ink-soft">{e.path ?? "—"} · {fmtTime(e.createdAt)}{e.digest && ` · ${e.digest}`}</p>{e.stack && <details className="mt-1"><summary className="cursor-pointer text-xs text-ink-soft">Stack</summary><pre className="mt-1 overflow-x-auto rounded-lg bg-muted p-3 text-xs">{e.stack}</pre></details>}</li>))}</ul> : <Empty>No errors recorded. 🎉</Empty>}</Panel>
    </>
  );
}
