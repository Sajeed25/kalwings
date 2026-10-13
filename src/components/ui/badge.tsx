import { cn } from "@/lib/utils";

type Tone = "neutral" | "accent" | "spot" | "dark" | "sample";
const tones: Record<Tone, string> = {
  neutral: "bg-muted text-ink-soft",
  accent: "bg-accent/15 text-accent",
  spot: "bg-spot/15 text-spot",
  dark: "bg-black text-white",
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

/** Placeholder for real photography. Clearly labelled. */
export function PhotoPlaceholder({ label, className }: { label: string; className?: string }) {
  return (
    <div role="img" aria-label={`Photo placeholder: ${label}`} className={cn("placeholder-img relative flex items-end overflow-hidden", className)}>
      <span className="m-3 rounded-md bg-surface px-2.5 py-1 text-[11px] font-medium text-ink-soft">
        Replace with photo · {label}
      </span>
    </div>
  );
}
