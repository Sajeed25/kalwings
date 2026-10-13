import { cn } from "@/lib/utils";

/** Slow infinite marquee (CSS only; paused for reduced-motion via global rule). Content is duplicated; the copy is aria-hidden. */
export function Marquee({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("group relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]", className)}>
      <div className="flex w-max animate-marquee gap-12 group-hover:[animation-play-state:paused]">
        <div className="flex shrink-0 items-center gap-12">{children}</div>
        <div className="flex shrink-0 items-center gap-12" aria-hidden>{children}</div>
      </div>
    </div>
  );
}
