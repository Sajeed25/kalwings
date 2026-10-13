import { cn } from "@/lib/utils";

type Tone = "neutral" | "teal" | "saffron" | "navy" | "sample";
const tones: Record<Tone, string> = {
  neutral: "bg-muted text-ink-soft",
  teal: "bg-teal/15 text-teal-700 dark:text-teal",
  saffron: "bg-saffron-50 text-saffron-700 dark:bg-saffron/15 dark:text-saffron",
  navy: "bg-navy text-white",
  sample: "border border-dashed border-ink-soft/40 text-ink-soft",
};

export function Badge({ tone = "neutral", className, children, title }: { tone?: Tone; className?: string; children: React.ReactNode; title?: string }) {
  return (
    <span title={title} className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", tones[tone], className)}>
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
      <span className="m-3 rounded-full bg-surface/80 px-2.5 py-1 text-[11px] font-medium text-ink-soft backdrop-blur">
        Replace with photo · {label}
      </span>
    </div>
  );
}
