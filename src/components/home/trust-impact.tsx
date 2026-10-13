import { Marquee } from "@/components/ui/marquee";
import { CountUp } from "@/components/ui/count-up";
import { Reveal } from "@/components/ui/reveal";
import { ecosystem, impact, partnerPlaceholders } from "@/data/sample";

export function TrustStrip() {
  const items = [...ecosystem, ...partnerPlaceholders];
  return (
    <section aria-labelledby="trust-h" className="border-y border-line bg-surface py-10">
      <div className="container">
        <h2 id="trust-h" className="text-center font-sans text-sm font-semibold tracking-normal text-ink-soft">Backed by an ecosystem that builds the future</h2>
        {/* TODO: replace wordmarks with official greyscale SVG logos (with permission). */}
        <Marquee className="mt-6">
          {items.map((n, i) => (
            <span key={i} className={`font-display text-xl font-bold tracking-tight grayscale ${n.startsWith("[") ? "rounded-lg border border-dashed border-ink-soft/40 px-3 py-1 text-base font-medium text-ink-soft" : "text-ink-soft"}`}>{n}</span>
          ))}
        </Marquee>
      </div>
    </section>
  );
}

export function Impact() {
  return (
    <section aria-label="Impact" className="section pb-0">
      <div className="container">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-5">
          {impact.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.06} className="flex flex-col">
              <dt className="order-2 mt-1 text-[15px] text-ink-soft">{s.label}</dt>
              <dd className="order-1 font-display text-5xl font-extrabold tracking-tight md:text-[3.25rem]"><CountUp value={s.value} suffix={s.suffix} /></dd>
            </Reveal>
          ))}
        </dl>
        <p className="mt-6 text-sm text-ink-soft">[X] = placeholder. Add verified figures in <code>src/data/sample.ts</code> — never publish estimates.</p>
      </div>
    </section>
  );
}
