import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * Kalwings mark: K with circuit nodes and signal bars (green → purple, as in the logo).
 * NOTE: this is an approximate redraw. To use the official artwork, replace public/brand/kalwings-mark.svg and
 * the paths below, or swap this component's body for <Image src="/brand/your-file.svg" />.
 */
export function LogoMark({ className, title }: { className?: string; title?: string }) {
  const id = useId();
  return (
    <svg viewBox="85 25 320 390" fill="none" className={cn("h-8 w-auto", className)} role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" y1="30" x2="0" y2="405">
          <stop offset="0" stopColor="#0DF27A" /><stop offset=".48" stopColor="#14E58A" /><stop offset=".72" stopColor="#3F9AB6" /><stop offset=".92" stopColor="#7C2FF6" /><stop offset="1" stopColor="#7C2FF6" />
        </linearGradient>
      </defs>
      <g stroke={`url(#${id})`} strokeWidth="40" strokeLinecap="round" strokeLinejoin="round">
        <path d="M125 68V375" /><path d="M175 205L272 68" /><path d="M200 190L357 64" /><path d="M175 225L277 375" /><path d="M225 215L357 375" />
      </g>
      <g fill={`url(#${id})`}>
        <circle cx="125" cy="68" r="30" /><circle cx="272" cy="68" r="30" /><circle cx="357" cy="64" r="30" />
        <circle cx="125" cy="375" r="30" /><circle cx="277" cy="375" r="30" /><circle cx="357" cy="375" r="30" />
        <circle cx="165" cy="215" r="38" /><circle cx="257" cy="218" r="11" />
        <rect x="277" y="175" width="20" height="87" rx="10" /><rect x="307" y="145" width="20" height="147" rx="10" />
        <rect x="337" y="120" width="20" height="198" rx="10" /><rect x="366" y="100" width="20" height="242" rx="10" />
      </g>
    </svg>
  );
}

/**
 * Full lockup, as in the supplied artwork: the K mark followed by ALWINGS in bold wide-tracked capitals,
 * purple on the left blending to green on the right. Redrawn in code (the original file was not available);
 * to use the exact artwork, put it in public/brand/ and swap this component's body for an <Image>.
 */
export function Logo({ className }: { className?: string; onDark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-[0.35em] whitespace-nowrap leading-none", className)} style={{ fontSize: "1.5rem" }}>
      <LogoMark className="h-[0.98em] shrink-0 -translate-y-px" />
      <span aria-hidden className="font-logo text-[1em] font-extrabold uppercase tracking-[0.16em]" style={{ backgroundImage: "linear-gradient(90deg, #8B2BF4 0%, #8B2BF4 26%, #3F9AB6 42%, #10F27D 60%, #10F27D 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", WebkitTextFillColor: "transparent" }}>Alwings</span>
      <span className="sr-only">Kalwings</span>
    </span>
  );
}

/** Section divider: a thin brand-gradient rule. */
export function Divider({ className }: { className?: string }) {
  return <div aria-hidden className={cn("container", className)}><div className="rule-gradient opacity-60" /></div>;
}
