import { cn } from "@/lib/utils";

export function PageHero({ eyebrow, title, lead, children }: { eyebrow: string; title: React.ReactNode; lead?: string; children?: React.ReactNode }) {
  return (
    <section className="pb-4 pt-10 md:pt-14">
      <div className="container">
        <div className="max-w-3xl">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-3 text-4xl font-bold leading-[1.05] md:text-6xl">{title}</h1>
          {lead && <p className="mt-4 max-w-2xl text-lg text-ink-soft">{lead}</p>}
          {children && <div className="mt-6 flex flex-wrap gap-3">{children}</div>}
        </div>
      </div>
    </section>
  );
}

export function Block({ className, children }: { className?: string; children: React.ReactNode }) {
  return <section className={cn("py-8 md:py-12", className)}><div className="container">{children}</div></section>;
}

export function Prose({ children }: { children: React.ReactNode }) {
  return <div className="container max-w-3xl py-14 md:py-20 [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-2xl [&_li]:mt-1.5 [&_p]:mt-4 [&_p]:text-ink-soft [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:text-ink-soft">{children}</div>;
}

export function DraftNotice({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl border border-dashed border-spot/60 bg-spot/10 p-4 text-sm text-spot ">{children}</p>;
}
