"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Counts up to `value` when scrolled into view. When value is null (no real number yet) renders an
 * obvious "[X]" placeholder — we never invent figures.
 */
export function CountUp({ value, suffix = "" }: { value: number | null; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState(0);

  useEffect(() => {
    if (value == null || !ref.current) return;
    const el = ref.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const io = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting) return;
      io.disconnect();
      if (reduce) return setN(value);
      const t0 = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / 1600);
        setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [value]);

  if (value == null) return <span ref={ref} title="Placeholder — add the real figure in src/data/sample.ts">[X]{suffix}</span>;
  return <span ref={ref}>{n.toLocaleString("en-IN")}{suffix}</span>;
}
