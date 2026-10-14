import { cn } from "@/lib/utils";

type Tone = "neutral" | "accent" | "spot" | "dark" | "sample";
const tones: Record<Tone, string> = {
  neutral: "bg-muted text-ink-soft",
  accent: "bg-primary/15 text-accent",
  spot: "bg-lilac/20 text-spot",
  dark: "bg-primary text-on-primary",
  sample: "border border-dashed border-ink-soft/40 text-ink-soft",
};

export function Badge({ tone = "neutral", className, children, title }: { tone?: Tone; className?: string; children: React.ReactNode; title?: string }) {
  return (
    <span title={title} className={cn("inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold", tones[tone], className)}>
      {children}
    </span>
  );
}

/** Marks placeholder content that must be replaced before launch. */
export function SampleTag({ className }: { className?: string }) {
  return <Badge tone="sample" className={className} title="Placeholder content — replace before launch">Sample</Badge>;
}
