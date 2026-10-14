import Link from "next/link";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Countdown } from "@/components/home/countdown";
import { db } from "@/lib/db";

/** The soonest-closing real challenge from a verified company. With none open, we say so and invite employers to host one; there is no fake countdown. */
async function nextChallenge() {
  try {
    return await db.opportunity.findFirst({
      where: { type: "CHALLENGE", moderated: "VERIFIED", closedAt: null, deadline: { gt: new Date() }, company: { status: "VERIFIED", isSample: false, members: { none: { user: { suspendedAt: { not: null } } } } } },
      include: { company: true }, orderBy: { deadline: "asc" },
    });
  } catch { return null; }
}

export async function ChallengeSpotlight() {
  const c = await nextChallenge();
  return (
    <section className="on-dark relative overflow-hidden bg-black py-20 text-white md:py-28">
      <div aria-hidden className="grid-bg pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_90%)]" />
      <div className="container relative grid items-center gap-12 lg:grid-cols-2">
        <Reveal>
          <p className="eyebrow !text-accent">Challenge-to-Hire</p>
          {c ? (
            <>
              <h2 className="h-section mt-3">{c.title}</h2>
              <p className="mt-5 max-w-lg text-lg text-white/75">{c.description.slice(0, 220)}{c.description.length > 220 ? "…" : ""}</p>
              <p className="mt-4 max-w-lg text-[15px] text-white/75"><span className="font-semibold text-white">The outcome:</span> {c.payText}. A strong result can earn an interview, not a guaranteed job.</p>
              <div className="mt-6 flex flex-wrap items-center gap-2"><span className="text-sm text-white/60">Hosted by:</span><Badge className="bg-white/10 text-white">{c.company.name}</Badge></div>
              <div className="mt-8 flex gap-3">
                <Button asChild size="lg"><Link href={`/challenges/${c.id}`}>Join the challenge</Link></Button>
                <Button asChild size="lg" variant="onNavy"><Link href="/challenges">See all challenges</Link></Button>
              </div>
            </>
          ) : (
            <>
              <h2 className="h-section mt-3">Prove it with real work.</h2>
              <p className="mt-5 max-w-lg text-lg text-white/75">Employers post a real problem, students submit their solution, and a human reviewer scores it against a public rubric. Strong results can lead to an interview. No challenge is open right now.</p>
              <div className="mt-8 flex gap-3">
                <Button asChild size="lg"><Link href="/employers">Host a challenge</Link></Button>
                <Button asChild size="lg" variant="onNavy"><Link href="/challenges">How challenges work</Link></Button>
              </div>
            </>
          )}
        </Reveal>
        {c && (
          <Reveal delay={0.1}>
            <div className="rounded-card-lg border border-white/10 bg-white/5 p-8 backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-wider text-white/60">Closes in</p>
              <Countdown iso={c.deadline.toISOString()} />
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}
