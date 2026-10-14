import type { Metadata } from "next";
import Link from "next/link";
import type { Role } from "@prisma/client";
import { Bell, LogOut } from "lucide-react";
import { requirePageRole } from "@/lib/session";
import { db } from "@/lib/db";
import { logout } from "@/app/actions/auth";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false } };
export const dynamic = "force-dynamic";

const links: Record<Role, [string, string][]> = {
  STUDENT: [["Overview", "/dashboard"], ["Profile", "/dashboard/profile"], ["Portfolio", "/dashboard/portfolio"], ["Talent Passport", "/dashboard/passport"], ["Applications", "/dashboard/applications"], ["Saved roles", "/dashboard/saved"], ["Mentor sessions", "/dashboard/mentoring"]],
  MENTOR: [["Overview", "/dashboard"], ["Mentor profile", "/dashboard/mentoring"]],
  EMPLOYER: [["Overview", "/dashboard"], ["Company", "/dashboard/company"], ["Roles & challenges", "/dashboard/roles"], ["Talent search", "/dashboard/talent"], ["Pipeline", "/dashboard/pipeline"]],
  COLLEGE_ADMIN: [["Overview", "/dashboard"], ["College", "/dashboard/college"]],
  PLATFORM_ADMIN: [["Overview & queues", "/dashboard"], ["Listing moderation", "/dashboard/moderation"], ["Passport verification", "/dashboard/credentials"], ["Reports", "/dashboard/reports"], ["Users", "/dashboard/users"], ["Contact inbox", "/dashboard/inbox"], ["Server errors", "/dashboard/errors"], ["Audit log", "/dashboard/audit"]],
};

export default async function DashLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageRole();
  const unread = await db.notification.count({ where: { userId: user.id, readAt: null } });
  return (
    <div className="container grid gap-8 py-8 lg:grid-cols-[230px_1fr]">
      <aside className="lg:sticky lg:top-24 lg:h-fit">
        <div className="card p-4">
          <p className="truncate font-display font-bold">{user.name}</p>
          <p className="text-xs uppercase tracking-wider text-ink-soft">{user.role.replace("_", " ").toLowerCase()}</p>
          <nav aria-label="Dashboard" className="mt-4 flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
            {links[user.role].map(([l, h]) => <Link key={h} href={h} className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-ink-soft transition hover:bg-muted hover:text-ink">{l}</Link>)}
            <Link href="/dashboard/account" className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-ink-soft transition hover:bg-muted hover:text-ink">Account &amp; data</Link>
            <Link href="/dashboard/notifications" className="flex items-center justify-between whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-ink-soft hover:bg-muted hover:text-ink"><span className="flex items-center gap-2"><Bell className="h-4 w-4" />Notifications</span>{unread > 0 && <span className="rounded-full bg-black px-2 text-xs text-white">{unread}</span>}</Link>
          </nav>
          <form action={logout} className="mt-3 border-t border-line pt-3"><button className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-ink-soft hover:bg-muted hover:text-ink"><LogOut className="h-4 w-4" />Log out</button></form>
        </div>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
