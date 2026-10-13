"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { novathon } from "@/data/sample";

function useCountdown(iso: string) {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const t = () => setLeft(Math.max(0, new Date(iso).getTime() - Date.now()));
    t();
    const id = setInterval(t, 1000);
    return () => clearInterval(id);
  }, [iso]);
  return left;
}

export function ChallengeSpotlight() {
  const left = useCountdown(novathon.deadline);
  const parts = left == null ? null : [
    ["Days", Math.floor(left / 864e5)], ["Hours", Math.floor(left / 36e5) % 24],
    ["Mins", Math.floor(left / 6e4) % 60], ["Secs", Math.floor(left / 1e3) % 60],
  ] as const;
  return (
    <section className="on-navy relative overflow-hidden bg-navy py-20 text-white md:py-28">
      <div aria-hidden className="absolute -left-24 top-0 h-96 w-96 rounded-full bg-teal/25 blur-3xl" />
      <div aria-hidden className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-sky/20 blur-3xl" />
      <div className="container relative grid items-center gap-12 lg:grid-cols-2">
        <Reveal>
          <p className="eyebrow !text-teal">Challenge-to-Hire</p>
          <h2 className="h-section mt-3">{novathon.name}</h2>
          <p className="mt-5 max-w-lg text-lg text-white/75">{novathon.brief}</p>
          <p className="mt-4 max-w-lg text-[15px] text-white/75"><span className="font-semibold text-white">The outcome:</span> {novathon.outcome}</p>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="text-sm text-white/60">Participating companies:</span>
            {novathon.companies.map((c) => <Badge key={c} className="bg-white/10 text-white">{c}</Badge>)}
          </div>
          <div className="mt-8 flex gap-3">
            <Button asChild size="lg"><Link href="/challenges">Join the challenge</Link></Button>
            <Button asChild size="lg" variant="onNavy"><Link href="/challenges">See all challenges</Link></Button>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="rounded-card-lg border border-white/10 bg-white/5 p-8 backdrop-blur">
            <p className="text-sm font-semibold uppercase tracking-wider text-white/60">Closes in</p>
            <div className="mt-4 grid grid-cols-4 gap-3" role="timer" aria-live="off">
              {(parts ?? [["Days", 0], ["Hours", 0], ["Mins", 0], ["Secs", 0]]).map(([l, v]) => (
                <div key={l} className="rounded-2xl bg-white/5 py-5 text-center">
                  <div className="font-display text-4xl font-extrabold tabular-nums md:text-5xl">{String(v).padStart(2, "0")}</div>
                  <div className="mt-1 text-xs text-white/60">{l}</div>
                </div>
              ))}
            </div>
            <p className="mt-6 text-sm text-white/60">Sample challenge and deadline — replace in <code>src/data/sample.ts</code>.</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
