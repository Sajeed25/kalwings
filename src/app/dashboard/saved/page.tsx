import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/session";
import { ActionButton } from "@/components/dash/action-form";
import { Empty, PageTitle, Panel, fmt } from "@/components/dash/ui";
import { toggleSave } from "@/app/actions/student";

export default async function Page() {
  const u = await requirePageRole("STUDENT");
  const p = await db.studentProfile.findUniqueOrThrow({ where: { userId: u.id }, include: { savedRoles: { include: { opportunity: { include: { company: true } } } } } });
  return (
    <>
      <PageTitle title="Saved roles" />
      <Panel>{p.savedRoles.length ? <ul className="divide-y divide-line">{p.savedRoles.map(({ opportunity: o }) => (
        <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><Link className="font-semibold underline" href={`/opportunities/${o.id}`}>{o.title}</Link><p className="text-sm text-ink-soft">{o.company.name} · {o.payText} · apply by {fmt(o.deadline)}</p></div><ActionButton variant="ghost" action={toggleSave.bind(null, o.id)}>Remove</ActionButton></li>))}</ul> : <Empty>Nothing saved yet.</Empty>}</Panel>
    </>
  );
}
