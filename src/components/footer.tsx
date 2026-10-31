"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { InstallApp } from "@/components/install-app";
import { LanguageSwitcher, useLang } from "@/components/language-switcher";
import { tr } from "@/lib/i18n";

const links = [["foot.privacy", "/privacy"], ["foot.terms", "/terms"], ["foot.trust", "/trust"], ["foot.help", "/help"], ["foot.contact", "/contact"]] as const;

export function Footer() {
  const lang = useLang();
  if (usePathname().startsWith("/dashboard")) return null;
  return (
    <footer className="mt-16 border-t border-line">
      <div className="container flex flex-col gap-3 py-8 text-sm text-ink-soft md:flex-row md:items-center md:justify-between">
        <p>© {new Date().getFullYear()} Kalwings</p>
        <ul className="flex flex-wrap gap-x-6 gap-y-2">{links.map(([l, h]) => <li key={h}><Link href={h} className="hover:text-ink">{tr(lang, l)}</Link></li>)}<li><InstallApp compact /></li><li><LanguageSwitcher /></li></ul>
      </div>
    </footer>
  );
}
