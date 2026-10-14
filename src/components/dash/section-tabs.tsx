"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Tab } from "@/lib/modules";
import { cn } from "@/lib/utils";

/** Shows the tabs of whichever module the current page belongs to, so related screens read as one place. */
export function SectionTabs({ groups }: { groups: Tab[][] }) {
  const path = usePathname();
  const on = (t: Tab) => path === t.href || path.startsWith(t.href + "/");
  const group = groups.find((g) => g.some(on));
  if (!group) return null;
  return (
    <nav aria-label="Section" className="mb-6 flex gap-1 overflow-x-auto border-b border-line">
      {group.map((t) => <Link key={t.href} href={t.href} aria-current={on(t) ? "page" : undefined} className={cn("-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition", on(t) ? "border-primary text-ink" : "border-transparent text-ink-soft hover:text-ink")}>{t.label}</Link>)}
    </nav>
  );
}
