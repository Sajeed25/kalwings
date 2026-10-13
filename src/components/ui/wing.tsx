import { cn } from "@/lib/utils";

/** The Kalwings wing motif: three rising feather strokes. Decorative unless given a title. */
export function WingMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={cn("h-8 w-8", className)} role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      <defs>
        <linearGradient id="kw-g" x1="4" y1="44" x2="44" y2="4" gradientUnits="userSpaceOnUse">
          <stop stopColor="#14B8A6" />
          <stop offset="1" stopColor="#38BDF8" />
        </linearGradient>
      </defs>
      <path d="M6 40C14 38 22 32 28 22c2-3 4-8 4-14 6 4 8 12 5 19-4 8-14 13-31 13Z" fill="url(#kw-g)" />
      <path d="M14 42c9-1 17-5 22-12 2-3 3-6 3-10 4 4 4 10 1 15-4 6-12 9-26 7Z" fill="url(#kw-g)" opacity=".55" />
      <path d="M24 44c6-1 11-4 14-8 1-2 2-4 2-6 3 3 2 7 0 10-3 4-8 5-16 4Z" fill="url(#kw-g)" opacity=".3" />
    </svg>
  );
}

export function Logo({ className, onDark }: { className?: string; onDark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-display text-[22px] font-extrabold tracking-tight", onDark ? "text-white" : "text-ink", className)}>
      <WingMark />
      Kalwings
    </span>
  );
}

/** Section divider: hairline that sweeps up into a small wing. */
export function WingDivider({ className }: { className?: string }) {
  return (
    <div className={cn("container flex items-center gap-4", className)} aria-hidden>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-line" />
      <WingMark className="h-5 w-5 opacity-70" />
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-line" />
    </div>
  );
}
