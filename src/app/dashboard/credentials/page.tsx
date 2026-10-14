import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/session";
import { ActionButton } from "@/components/dash/action-form";
import { Empty, PageTitle, Panel } from "@/components/dash/ui";
import { reviewEntry } from "@/app/actions/admin";

export default async function Page() {
  await requirePageRole("PLATFORM_ADMIN");
  const items = await db.passportEntry.findMany({ where: { verifyRequested: true, status: "PENDING" }, orderBy: { createdAt: "asc" }, take: 100, include: { student: { include: { user: { select: { name: true } } } } } });
  return (
    <>
      <PageTitle title="Passport verification" sub="Open the evidence link and confirm it shows this person and this achievement before approving. Reject if you can't confirm it." />
      <Panel>{items.length ? <ul className="divide-y divide-line">{items.map((e) => (
        <li key={e.id} className="py-4">
          <p className="font-semibold">{e.title} <span className="text-ink-soft">· {e.student.user.name} · {e.kind.toLowerCase()}{e.org && ` · ${e.org}`}</span></p>
          {e.summary && <p className="text-sm text-ink-soft">{e.summary}</p>}
          {e.url && <p className="text-sm"><a className="font-semibold underline" href={e.url} rel="noopener noreferrer nofollow" target="_blank">{e.url}</a></p>}
          <div className="mt-2 flex gap-2"><ActionButton variant="primary" action={reviewEntry.bind(null, e.id, "VERIFIED")}>Verify</ActionButton><ActionButton action={reviewEntry.bind(null, e.id, "REJECTED")}>Reject</ActionButton></div>
        </li>))}</ul> : <Empty>Nothing waiting for verification.</Empty>}</Panel>
    </>
  );
}
