import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/session";
import { ActionButton, ActionForm } from "@/components/dash/action-form";
import { setEmailNotifications } from "@/app/actions/common";
import { Empty, PageTitle, Panel, fmtTime } from "@/components/dash/ui";
import { markNotificationsRead } from "@/app/actions/student";

export default async function Page() {
  const u = await requirePageRole();
  const items = await db.notification.findMany({ where: { userId: u.id }, orderBy: { createdAt: "desc" }, take: 50 });
  return (
    <>
      <PageTitle title="Notifications" />
      <Panel action={items.some((n) => !n.readAt) ? <ActionButton action={markNotificationsRead}>Mark all read</ActionButton> : undefined}>
        {items.length ? <ul className="divide-y divide-line">{items.map((n) => <li key={n.id} className="py-3"><p className={n.readAt ? "" : "font-semibold"}>{n.title}</p>{n.body && <p className="text-sm text-ink-soft">{n.body}</p>}<p className="text-xs text-ink-soft">{fmtTime(n.createdAt)}</p></li>)}</ul> : <Empty>You&apos;re all caught up.</Empty>}
      </Panel>
      <Panel title="Email" className="mt-6">
        <ActionForm action={setEmailNotifications} submit="Save" className="space-y-3">
          <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="email" defaultChecked={u.emailNotifications} className="mt-1 h-4 w-4 accent-neon" /><span>Email me about applications, mentor sessions and messages{u.email ? <> at <b>{u.email}</b></> : <span className="text-ink-soft"> (add an email address to your account to receive them)</span>}.</span></label>
        </ActionForm>
      </Panel>
    </>
  );
}
