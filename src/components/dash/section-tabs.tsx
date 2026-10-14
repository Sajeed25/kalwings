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
    <nav aria-label="Section" className="mb-8 flex max-w-full overflow-x-auto"><div className="inline-flex gap-1 rounded-full bg-muted p-1">
      {group.map((t) => <Link key={t.href} href={t.href} aria-current={on(t) ? "page" : undefined} className={cn("whitespace-nowrap rounded-full px-5 py-2 text-sm font-semibold transition", on(t) ? "bg-ink text-bg" : "text-ink-soft hover:text-ink")}>{t.label}</Link>)}
    </div></nav>
  );
}
