import { Marquee } from "@/components/ui/marquee";
import { CountUp } from "@/components/ui/count-up";
import { Reveal } from "@/components/ui/reveal";
import { SOURCE, impact, recognitions } from "@/data/robokalam";

export function TrustStrip() {
  const items = [...recognitions.map((r) => r.t), "KodeZ alumni work at Infosys, Accenture and Cognizant"];
  return (
    <section aria-labelledby="trust-h" className="border-y border-line bg-surface py-10">
      <div className="container">
        <h2 id="trust-h" className="text-center font-sans text-sm font-semibold tracking-normal text-ink-soft">Built by the team behind Robokalam and KodeZ</h2>
        <Marquee className="mt-6">
          {items.map((n, i) => <span key={i} className="font-display text-xl font-bold tracking-tight text-ink-soft">{n}</span>)}
        </Marquee>
      </div>
    </section>
  );
}

export function Impact() {
  return (
    <section aria-label="Impact" className="section pb-0">
      <div className="container">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
          {impact.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.06} className="flex flex-col">
              <dt className="order-2 mt-1 text-[15px] text-ink-soft">{s.label}</dt>
              <dd className="order-1 font-display text-5xl font-extrabold tracking-tight md:text-[3.25rem]"><CountUp value={s.value} suffix={s.suffix} /></dd>
            </Reveal>
          ))}
        </dl>
        <p className="mt-6 text-sm text-ink-soft">Figures as published by <a className="underline" href={SOURCE.url} rel="noopener">{SOURCE.label}</a>. Kalwings platform numbers will appear here once there are real ones to show.</p>
      </div>
    </section>
  );
}
