import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/session";
import { Empty, PageTitle, Panel, fmtTime } from "@/components/dash/ui";

export default async function Page() {
  await requirePageRole("PLATFORM_ADMIN");
  const logs = await db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 200, include: { actor: { select: { name: true } } } });
  return (
    <>
      <PageTitle title="Audit log" sub="Every admin decision is recorded." />
      <Panel>{logs.length ? <ul className="divide-y divide-line text-sm">{logs.map((l) => <li key={l.id} className="py-2"><b>{l.actor.name}</b> · {l.action} · {l.target} <span className="text-ink-soft">· {fmtTime(l.createdAt)}</span></li>)}</ul> : <Empty>Nothing yet.</Empty>}</Panel>
    </>
  );
}
