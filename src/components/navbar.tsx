"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/wing";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { nav } from "@/lib/site";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => setSignedIn(document.cookie.includes("kw_in=1")), []);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);

  return (
    <header className={cn("sticky top-0 z-50 transition duration-300", scrolled || open ? "border-b border-line bg-bg/80 backdrop-blur-xl" : "border-b border-transparent")}>
      <div className="container flex h-[72px] items-center justify-between">
        <Link href="/" aria-label="Kalwings home"><Logo /></Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-full px-3.5 py-2 text-[15px] font-medium text-ink-soft transition hover:bg-muted hover:text-ink">{n.label}</Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <ThemeToggle />
          {signedIn ? <Button asChild><Link href="/dashboard">Dashboard</Link></Button> : <>
            <Button asChild variant="ghost"><Link href="/login">Log in</Link></Button>
            <Button asChild><Link href="/join">Join Kalwings</Link></Button></>}
        </div>

        <div className="flex items-center gap-1 lg:hidden">
          <ThemeToggle />
          <button aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen(!open)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-muted">
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {open && (
        <div id="mobile-menu" className="fixed inset-x-0 top-[72px] bottom-0 overflow-y-auto bg-bg px-6 pb-10 pt-4 lg:hidden">
          <nav aria-label="Mobile" className="flex flex-col">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="border-b border-line py-4 font-display text-2xl font-bold">{n.label}</Link>
            ))}
          </nav>
          <div className="mt-8 flex flex-col gap-3">
            {signedIn ? <Button asChild size="lg"><Link href="/dashboard" onClick={() => setOpen(false)}>Dashboard</Link></Button> : <>
              <Button asChild size="lg"><Link href="/join" onClick={() => setOpen(false)}>Join Kalwings</Link></Button>
              <Button asChild size="lg" variant="secondary"><Link href="/login" onClick={() => setOpen(false)}>Log in</Link></Button></>}
          </div>
        </div>
      )}
    </header>
  );
}
