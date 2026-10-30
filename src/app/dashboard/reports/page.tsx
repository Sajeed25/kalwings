import { hideEvent } from "@/app/actions/events";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/session";
import { ActionButton } from "@/components/dash/action-form";
import { Empty, PageTitle, Panel, fmtTime } from "@/components/dash/ui";
import { resolveReport } from "@/app/actions/admin";
import { archiveGroup, setHidden } from "@/app/actions/community";

export default async function Page() {
  await requirePageRole("PLATFORM_ADMIN");
  const items = await db.report.findMany({ orderBy: [{ resolvedAt: "asc" }, { createdAt: "desc" }], take: 100, include: { reporter: { select: { name: true } } } });
  return (
    <>
      <PageTitle title="Fraud & abuse reports" />
      <Panel>{items.length ? <ul className="divide-y divide-line">{items.map((r) => (
        <li key={r.id} className="flex flex-wrap items-start justify-between gap-3 py-3"><div><p className="font-semibold">{r.targetType.toLowerCase()} · {r.targetId}</p><p className="text-sm">{r.reason}</p><p className="text-xs text-ink-soft">by {r.reporter?.name ?? "anonymous"} · {fmtTime(r.createdAt)}</p></div><div className="flex flex-wrap items-center gap-2">
          {(r.targetType === "POST" || r.targetType === "COMMENT") && <ActionButton variant="primary" action={setHidden.bind(null, r.targetType, r.targetId, true)}>Hide content</ActionButton>}
          {r.targetType === "EVENT" && <ActionButton variant="primary" confirm="Hide this event from the public?" action={hideEvent.bind(null, r.targetId, true)}>Hide event</ActionButton>}
          {r.targetType === "GROUP" && <ActionButton variant="primary" confirm="Archive this group?" action={archiveGroup.bind(null, r.targetId, true)}>Archive group</ActionButton>}
          {r.resolvedAt ? <span className="text-sm text-ink-soft">Resolved</span> : <ActionButton action={resolveReport.bind(null, r.id)}>Mark resolved</ActionButton>}</div></li>))}</ul> : <Empty>No reports.</Empty>}</Panel>
    </>
  );
}
