"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/brand";
import { Button } from "@/components/ui/button";
import { nav } from "@/lib/site";
import { NAV_KEY, tr } from "@/lib/i18n";
import { useLang } from "@/components/language-switcher";

/** Slim header. Inside the dashboard it is just the logo (the sidebar holds navigation); elsewhere it adds the public browse links. */
export function Navbar() {
  const path = usePathname();
  const lang = useLang();
  const app = path.startsWith("/dashboard");
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => setSignedIn(document.cookie.includes("kw_in=1")), []);
  useEffect(() => setOpen(false), [path]);

  if (app) return null; // the dashboard sidebar carries the logo
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link href={signedIn ? "/dashboard" : "/login"} aria-label="Kalwings"><Logo /></Link>
        {!app && (
          <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
            {nav.map((n) => <Link key={n.href} href={n.href} className="rounded-md px-3 py-2 text-sm font-medium text-ink-soft transition hover:bg-muted hover:text-ink">{NAV_KEY[n.href] ? tr(lang, NAV_KEY[n.href]) : n.label}</Link>)}
          </nav>
        )}
        <div className="flex items-center gap-2">
          {signedIn
            ? (!app && <Button asChild size="sm"><Link href="/dashboard">{tr(lang, "auth.workspace")}</Link></Button>)
            : <><Button asChild variant="ghost" size="sm"><Link href="/login">{tr(lang, "auth.login")}</Link></Button><Button asChild size="sm" className="hidden sm:inline-flex"><Link href="/join">{tr(lang, "auth.join")}</Link></Button></>}
          {!app && <button aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen(!open)} className="grid h-10 w-10 place-items-center rounded-md text-ink md:hidden">{open ? <X /> : <Menu />}</button>}
        </div>
      </div>
      {open && !app && (
        <nav id="mobile-menu" aria-label="Mobile" className="container flex flex-col border-t border-line pb-4 md:hidden">
          {nav.map((n) => <Link key={n.href} href={n.href} className="border-b border-line py-3 text-ink">{NAV_KEY[n.href] ? tr(lang, NAV_KEY[n.href]) : n.label}</Link>)}
        </nav>
      )}
    </header>
  );
}
