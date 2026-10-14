import { tileFill } from "@/components/ui/company-logo";
import type { Metadata } from "next";
import { asList } from "@/lib/lists";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getUser } from "@/lib/session";
import { Block } from "@/components/pages/shell";
import { Badge, SampleTag } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActionForm, Area, Field } from "@/components/dash/action-form";
import { requestSession } from "@/app/actions/student";
import { fmtTime } from "@/components/dash/ui";

export const dynamic = "force-dynamic";
const load = (slug: string) => db.mentorProfile.findFirst({ where: { slug, status: "VERIFIED", user: { suspendedAt: null } }, include: { user: true, slots: { where: { startsAt: { gt: new Date() }, sessionId: null }, orderBy: { startsAt: "asc" }, take: 10 } } });

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const m = await load((await params).slug);
  return { title: m ? `${m.user.name} — Mentor` : "Mentor", robots: m?.isSample ? { index: false } : undefined };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const m = await load(slug);
  if (!m) notFound();
  const user = await getUser();
  return (
    <Block>
      <Link href="/mentors" className="text-sm font-semibold text-accent">← All mentors</Link>
      <div className="mt-6 grid gap-10 md:grid-cols-[320px_1fr]">
        {m.avatarId
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={`/api/files/${m.avatarId}`} alt={`Photo of ${m.user.name}`} className="aspect-[4/5] w-full rounded-card-lg object-cover" width={640} height={800} />
          : <div role="img" aria-label={`${m.user.name}, no photo yet`} className={`grid aspect-[4/5] place-items-center rounded-card-lg font-serif text-8xl italic ${tileFill(m.user.name)}`}>{m.user.name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("")}</div>}
        <div>
          <h1 className="text-4xl font-semibold md:text-5xl">{m.user.name}</h1>
          <p className="mt-2 text-lg text-ink-soft">{m.roleTitle} · {m.company} · {m.country}</p>
          <ul className="mt-4 flex flex-wrap items-center gap-2">{asList(m.tags).map((t) => <li key={t}><Badge tone="accent">{t}</Badge></li>)}{m.isSample && <li><SampleTag /></li>}</ul>
          {m.bio && <p className="mt-6 text-ink-soft">{m.bio}</p>}
          <h2 className="mt-8 text-xl">Upcoming office hours</h2>
          {m.slots.length ? <ul className="mt-2 text-sm text-ink-soft">{m.slots.map((s) => <li key={s.id}>{fmtTime(s.startsAt)} IST</li>)}</ul> : <p className="mt-2 text-sm text-ink-soft">No open slots right now — you can still send a request and the mentor will suggest a time.</p>}
          <div className="mt-8">
            {!user ? <Button asChild size="lg"><Link href="/login">Log in to request a session</Link></Button>
              : user.role !== "STUDENT" ? <Badge>Only students can request sessions</Badge>
              : (<div className="card max-w-lg p-6"><h2 className="mb-3 text-xl">Request a session</h2>
                  <ActionForm action={requestSession} reset submit="Send request" success="Request sent — track it in your dashboard.">
                    <input type="hidden" name="mentorId" value={m.id} />
                    <fieldset className="space-y-2"><legend className="text-sm font-semibold">Pick a time (IST)</legend>
                      {m.slots.map((s) => <label key={s.id} className="flex items-center gap-2 text-sm"><input type="radio" name="slotId" value={s.id} className="accent-neon" />{fmtTime(s.startsAt)}</label>)}
                      <label className="flex items-center gap-2 text-sm"><input type="radio" name="slotId" value="" defaultChecked className="accent-neon" />No specific time</label>
                    </fieldset>
                    <Field label="Topic" name="topic" required minLength={3} maxLength={120} /><Area label="Anything the mentor should know?" name="message" maxLength={500} />
                  </ActionForm></div>)}
          </div>
        </div>
      </div>
    </Block>
  );
}
