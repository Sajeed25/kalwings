import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/session";
import { ActionButton } from "@/components/dash/action-form";
import { Empty, PageTitle, Panel, fmtTime } from "@/components/dash/ui";
import { markContactHandled } from "@/app/actions/admin";

export default async function Page() {
  await requirePageRole("PLATFORM_ADMIN");
  const items = await db.contactMessage.findMany({ orderBy: [{ handledAt: "asc" }, { createdAt: "desc" }], take: 100 });
  return (
    <>
      <PageTitle title="Contact inbox" />
      <Panel>{items.length ? <ul className="divide-y divide-line">{items.map((m) => (
        <li key={m.id} className="py-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">{m.name} <span className="font-normal text-ink-soft">· {m.topic} · {fmtTime(m.createdAt)}</span></p><a className="text-sm underline" href={`mailto:${m.email}`}>{m.email}</a></div>{m.handledAt ? <span className="text-sm text-ink-soft">Handled</span> : <ActionButton action={markContactHandled.bind(null, m.id)}>Mark handled</ActionButton>}</div><p className="mt-2 whitespace-pre-line text-sm">{m.message}</p></li>))}</ul> : <Empty>No messages.</Empty>}</Panel>
    </>
  );
}
