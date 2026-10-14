import { cn } from "@/lib/utils";

type Tone = "neutral" | "accent" | "spot" | "dark" | "sample";
const tones: Record<Tone, string> = {
  neutral: "bg-muted text-ink-soft",
  accent: "bg-accent/15 text-accent",
  spot: "bg-spot/15 text-spot",
  dark: "bg-primary text-white",
  sample: "border border-dashed border-ink-soft/40 text-ink-soft",
};

export function Badge({ tone = "neutral", className, children, title }: { tone?: Tone; className?: string; children: React.ReactNode; title?: string }) {
  return (
    <span title={title} className={cn("inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold", tones[tone], className)}>
      {children}
    </span>
  );
}

/** Marks placeholder content that must be replaced before launch. */
export function SampleTag({ className }: { className?: string }) {
  return <Badge tone="sample" className={className} title="Placeholder content — replace before launch">Sample</Badge>;
}

/** Shown when a person has not uploaded a photo. */
export function PhotoPlaceholder({ label, className }: { label: string; className?: string }) {
  return (
    <div role="img" aria-label={`No photo yet: ${label}`} className={cn("placeholder-img relative grid place-items-center overflow-hidden", className)}>
      <svg aria-hidden viewBox="0 0 24 24" className="h-1/3 w-1/3 max-w-16 text-ink-soft/50" fill="currentColor"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8z" /></svg>
    </div>
  );
}
