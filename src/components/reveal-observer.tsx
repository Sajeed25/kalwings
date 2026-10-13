"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** One IntersectionObserver for every .reveal / .draw element on the page. Re-scans on route change. */
export function RevealObserver() {
  const path = usePathname();
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".reveal:not(.is-visible), .draw:not(.is-visible)"));
    if (!("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("is-visible")); return; }
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
    }, { rootMargin: "0px 0px -80px 0px" });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [path]);
  return null;
}
