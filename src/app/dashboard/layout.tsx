import type { Metadata } from "next";
import { requirePageRole } from "@/lib/session";
import { db } from "@/lib/db";
import { logout } from "@/app/actions/auth";
import { MODULES, tabGroups } from "@/lib/modules";
import { Sidebar } from "@/components/dash/sidebar";
import { SectionTabs } from "@/components/dash/section-tabs";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function DashLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageRole();
  const unread = await db.notification.count({ where: { userId: user.id, readAt: null } });
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[288px_minmax(0,1fr)]">
      <Sidebar name={user.name} role={user.role} sections={MODULES[user.role]} unread={unread} logout={logout} />
      <div className="min-w-0 px-5 py-8 lg:px-12 lg:py-10"><div className="max-w-[1440px]"><SectionTabs groups={tabGroups(user.role)} />{children}</div></div>
    </div>
  );
}
