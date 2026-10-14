import { cn } from "@/lib/utils";

/**
 * Kalwings mark: K with circuit nodes and signal bars, drawn in one flat colour (follows the accent).
 * NOTE: this is an approximate redraw. To use the official artwork, replace the paths below or swap this body for <Image src="/brand/your-file.svg" />.
 */
export function LogoMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="85 25 320 390" fill="none" className={cn("h-8 w-auto text-accent", className)} role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      <g stroke="currentColor" strokeWidth="40" strokeLinecap="round" strokeLinejoin="round">
        <path d="M125 68V375" /><path d="M175 205L272 68" /><path d="M200 190L357 64" /><path d="M175 225L277 375" /><path d="M225 215L357 375" />
      </g>
      <g fill="currentColor">
        <circle cx="125" cy="68" r="30" /><circle cx="272" cy="68" r="30" /><circle cx="357" cy="64" r="30" />
        <circle cx="125" cy="375" r="30" /><circle cx="277" cy="375" r="30" /><circle cx="357" cy="375" r="30" />
        <circle cx="165" cy="215" r="38" /><circle cx="257" cy="218" r="11" />
        <rect x="277" y="175" width="20" height="87" rx="10" /><rect x="307" y="145" width="20" height="147" rx="10" />
        <rect x="337" y="120" width="20" height="198" rx="10" /><rect x="366" y="100" width="20" height="242" rx="10" />
      </g>
    </svg>
  );
}

export function Logo({ className }: { className?: string; onDark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 whitespace-nowrap font-display text-lg font-semibold tracking-tight text-ink", className)}>
      <LogoMark className="h-7" />
      Kalwings
    </span>
  );
}
