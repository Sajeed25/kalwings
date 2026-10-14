"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, LayoutDashboard, LogOut, Settings } from "lucide-react";
import type { Section } from "@/lib/modules";
import { Logo } from "@/components/ui/brand";
import { ModuleIcon } from "@/components/dash/icons";
import { cn } from "@/lib/utils";

/** A module is active on its own page and on any of its tabs. */
const owns = (m: Section["items"][number], path: string) => path === m.href || path.startsWith(m.href + "/") || !!m.tabs?.some((t) => path === t.href || path.startsWith(t.href + "/"));

export function Sidebar({ name, role, sections, unread, logout }: { name: string; role: string; sections: Section[]; unread: number; logout: () => Promise<void> }) {
  const path = usePathname();
  const link = (active: boolean) => cn("flex items-center gap-3 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold transition", active ? "bg-primary text-on-primary" : "text-ink-soft hover:bg-muted hover:text-ink");
  const initials = name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return (
    <aside className="border-b border-line bg-bg lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:border-b-0 lg:border-r">
      <div className="flex flex-col gap-5 p-4 lg:min-h-full lg:p-6">
        <div className="flex items-center justify-between"><Link href="/dashboard" aria-label="Kalwings home"><Logo /></Link></div>
        <nav aria-label="Dashboard" className="flex gap-5 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
          <div className="flex gap-1 lg:flex-col"><Link href="/dashboard" aria-current={path === "/dashboard" ? "page" : undefined} className={link(path === "/dashboard")}><LayoutDashboard className="h-[18px] w-[18px]" aria-hidden />Overview</Link></div>
          {sections.map((s) => (
            <div key={s.title} className="flex gap-1 lg:flex-col">
              <p className="hidden px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft lg:block">{s.title}</p>
              {s.items.map((m) => { const on = owns(m, path); return <Link key={m.href} href={m.href} aria-current={on ? "page" : undefined} className={link(on)}><ModuleIcon name={m.icon} className="h-[18px] w-[18px]" />{m.label}</Link>; })}
            </div>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-1 border-t border-line pt-4">
          <Link href="/dashboard/notifications" aria-current={path.startsWith("/dashboard/notifications") ? "page" : undefined} className={cn(link(path.startsWith("/dashboard/notifications")), "justify-between")}><span className="flex items-center gap-3"><Bell className="h-[18px] w-[18px]" aria-hidden />Notifications</span>{unread > 0 && <span className="rounded-full bg-primary px-2 text-xs font-bold text-on-primary">{unread}</span>}</Link>
          <Link href="/dashboard/account" aria-current={path.startsWith("/dashboard/account") ? "page" : undefined} className={link(path.startsWith("/dashboard/account"))}><Settings className="h-[18px] w-[18px]" aria-hidden />Settings</Link>
          <form action={logout}><button className={cn(link(false), "w-full")}><LogOut className="h-[18px] w-[18px]" aria-hidden />Log out</button></form>
          <div className="mt-3 flex items-center gap-3 rounded-2xl bg-surface p-3"><span aria-hidden className="sticker-lilac grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold">{initials}</span><span className="min-w-0"><span className="block truncate text-sm font-semibold">{name}</span><span className="block text-xs capitalize text-ink-soft">{role.replace("_", " ").toLowerCase()}</span></span></div>
        </div>
      </div>
    </aside>
  );
}
