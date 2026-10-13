import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";

export function PageHero({ eyebrow, title, lead, children }: { eyebrow: string; title: React.ReactNode; lead?: string; children?: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden border-b border-line pb-14 pt-14 md:pb-20 md:pt-24">
      <div aria-hidden className="grid-bg pointer-events-none absolute inset-0 -z-10 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
      <div className="container">
        <Reveal className="max-w-3xl">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-3 text-[2.5rem] font-extrabold leading-[1.05] tracking-[-0.03em] md:text-6xl">{title}</h1>
          {lead && <p className="mt-5 text-lg text-ink-soft md:text-xl">{lead}</p>}
          {children && <div className="mt-8 flex flex-wrap gap-3">{children}</div>}
        </Reveal>
      </div>
    </section>
  );
}

export function Block({ className, children }: { className?: string; children: React.ReactNode }) {
  return <section className={cn("py-16 md:py-20", className)}><div className="container">{children}</div></section>;
}

export function Prose({ children }: { children: React.ReactNode }) {
  return <div className="container max-w-3xl py-14 md:py-20 [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-2xl [&_li]:mt-1.5 [&_p]:mt-4 [&_p]:text-ink-soft [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:text-ink-soft">{children}</div>;
}

export function DraftNotice({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl border border-dashed border-spot/60 bg-spot/10 p-4 text-sm text-spot ">{children}</p>;
}

export function FeatureGrid({ items, heading = "Highlights" }: { items: { t: string; d: string }[]; heading?: string }) {
  return (
    <>
    <h2 className="sr-only">{heading}</h2>
    <ul className="grid gap-6 md:grid-cols-3">
      {items.map((f, i) => (
        <Reveal as="li" key={f.t} delay={i * 0.06}>
          <div className="card card-hover h-full p-7"><h3 className="text-xl">{f.t}</h3><p className="mt-2 text-ink-soft">{f.d}</p></div>
        </Reveal>
      ))}
    </ul>
    </>
  );
}
