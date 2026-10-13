import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/session";
import { ActionButton } from "@/components/dash/action-form";
import { Empty, PageTitle, Panel, Status, fmt } from "@/components/dash/ui";
import { moderateOpportunity } from "@/app/actions/admin";

export default async function Page() {
  await requirePageRole("PLATFORM_ADMIN");
  const items = await db.opportunity.findMany({ orderBy: [{ moderated: "asc" }, { createdAt: "desc" }], take: 100, include: { company: true } });
  return (
    <>
      <PageTitle title="Listing moderation" sub="Check pay, work mode, location and eligibility are clear, and the role is real." />
      <Panel>{items.length ? <ul className="divide-y divide-line">{items.map((o) => (
        <li key={o.id} className="py-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-semibold">{o.title} <span className="text-ink-soft">· {o.company.name}</span></p><p className="text-sm text-ink-soft">{o.payText} · {o.workMode.toLowerCase()} · {o.location} · {o.eligibility} · closes {fmt(o.deadline)}</p></div><Status s={o.moderated} /></div>
          <p className="mt-1 line-clamp-2 text-sm">{o.description}</p>
          <div className="mt-2 flex gap-2">{o.moderated !== "VERIFIED" && <ActionButton variant="primary" action={moderateOpportunity.bind(null, o.id, "VERIFIED")}>Approve</ActionButton>}{o.moderated !== "REJECTED" && <ActionButton action={moderateOpportunity.bind(null, o.id, "REJECTED")}>Reject</ActionButton>}</div></li>))}</ul> : <Empty>No listings.</Empty>}</Panel>
    </>
  );
}
