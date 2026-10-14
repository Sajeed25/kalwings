"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links: [string, string][] = [["Privacy", "/privacy"], ["Terms", "/terms"], ["Trust & Safety", "/trust"], ["Help", "/help"], ["Contact", "/contact"]];

export function Footer() {
  if (usePathname().startsWith("/dashboard")) return null;
  return (
    <footer className="mt-16 border-t border-line">
      <div className="container flex flex-col gap-3 py-8 text-sm text-ink-soft md:flex-row md:items-center md:justify-between">
        <p>© {new Date().getFullYear()} Kalwings</p>
        <ul className="flex flex-wrap gap-x-6 gap-y-2">{links.map(([l, h]) => <li key={h}><Link href={h} className="hover:text-ink">{l}</Link></li>)}</ul>
      </div>
    </footer>
  );
}
