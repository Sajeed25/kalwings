"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, LogOut, Settings } from "lucide-react";
import type { Section } from "@/lib/modules";
import { cn } from "@/lib/utils";

/** A module is active on its own page and on any of its tabs. */
const owns = (m: Section["items"][number], path: string) => path === m.href || path.startsWith(m.href + "/") || !!m.tabs?.some((t) => path === t.href || path.startsWith(t.href + "/"));

export function Sidebar({ name, role, sections, unread, logout }: { name: string; role: string; sections: Section[]; unread: number; logout: () => Promise<void> }) {
  const path = usePathname();
  const link = (active: boolean) => cn("flex items-center justify-between whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition", active ? "bg-primary/15 text-ink" : "text-ink-soft hover:bg-muted hover:text-ink");
  return (
    <aside className="lg:sticky lg:top-20 lg:h-fit">
      <div className="rounded-card border border-line bg-surface p-4">
        <p className="truncate font-semibold">{name}</p>
        <p className="text-xs capitalize text-ink-soft">{role.replace("_", " ").toLowerCase()}</p>
        <nav aria-label="Dashboard" className="mt-4 flex gap-4 overflow-x-auto lg:flex-col lg:gap-5 lg:overflow-visible">
          <div className="flex gap-1 lg:flex-col"><Link href="/dashboard" aria-current={path === "/dashboard" ? "page" : undefined} className={link(path === "/dashboard")}>Overview</Link></div>
          {sections.map((s) => (
            <div key={s.title} className="flex gap-1 lg:flex-col">
              <p className="hidden px-3 text-[11px] font-semibold uppercase tracking-wider text-ink-soft lg:block">{s.title}</p>
              {s.items.map((m) => { const on = owns(m, path); return <Link key={m.href} href={m.href} aria-current={on ? "page" : undefined} className={link(on)}>{m.label}</Link>; })}
            </div>
          ))}
        </nav>
        <div className="mt-4 flex flex-col gap-1 border-t border-line pt-3">
          <Link href="/dashboard/notifications" aria-current={path.startsWith("/dashboard/notifications") ? "page" : undefined} className={link(path.startsWith("/dashboard/notifications"))}><span className="flex items-center gap-2"><Bell className="h-4 w-4" aria-hidden />Notifications</span>{unread > 0 && <span className="rounded-full bg-primary px-2 text-xs font-semibold text-white">{unread}</span>}</Link>
          <Link href="/dashboard/account" aria-current={path.startsWith("/dashboard/account") ? "page" : undefined} className={link(path.startsWith("/dashboard/account"))}><span className="flex items-center gap-2"><Settings className="h-4 w-4" aria-hidden />Settings</span></Link>
          <form action={logout}><button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-ink-soft transition hover:bg-muted hover:text-ink"><LogOut className="h-4 w-4" aria-hidden />Log out</button></form>
        </div>
      </div>
    </aside>
  );
}
