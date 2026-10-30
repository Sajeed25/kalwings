import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { Serif } from "@/components/ui/serif";
import { PageHero, Block } from "@/components/pages/shell";
import { Badge } from "@/components/ui/badge";
import { EVENT_KINDS, KIND_LABEL, MODE_LABEL, fmtWhen, priceLabel } from "@/lib/events";
import { getUser } from "@/lib/session";

export const metadata: Metadata = { title: "Events and webinars", description: "Webinars, workshops, hackathons and meetups for freshers from verified colleges, employers and mentors. Price and time always shown." };
export const dynamic = "force-dynamic";
type SP = Record<string, string | string[] | undefined>; const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.slice(0, 60);

export default async function Page({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams; const q = one(sp.q), kind = one(sp.kind), mode = one(sp.mode), city = one(sp.city);
  let events: Awaited<ReturnType<typeof load>> = []; let down = false;
  async function load() {
    return db.event.findMany({
      where: { status: "LIVE", startsAt: { gte: new Date(Date.now() - 2 * 3600_000) }, ...(kind && (EVENT_KINDS as readonly string[]).includes(kind) ? { kind } : {}), ...(mode === "REMOTE" || mode === "HYBRID" || mode === "ONSITE" ? { mode } : {}), ...(city ? { location: { contains: city } } : {}),
        ...(q ? { OR: [{ title: { contains: q } }, { organiserName: { contains: q } }, { description: { contains: q } }] } : {}) },
      orderBy: { startsAt: "asc" }, take: 60, include: { _count: { select: { rsvps: true } } },
    });
  }
  try { events = await load(); } catch (e) { down = true; console.error("[events] load failed:", e instanceof Error ? e.message : e); }
  const user = await getUser(); const canPost = !!user && ["EMPLOYER", "COLLEGE_ADMIN", "MENTOR", "PLATFORM_ADMIN"].includes(user.role);
  const sel = "h-11 rounded-lg border border-line bg-surface px-3";
  return (
    <>
      <PageHero eyebrow="Events" title={<>Learn, meet and <Serif>compete</Serif>.</>} lead="Webinars, workshops, hackathons and campus events from verified colleges, employers and mentors. The time, place and price are always shown." />
      <Block>
        <form role="search" aria-label="Filter events" className="mb-6 flex flex-wrap gap-2">
          <input name="q" defaultValue={q} placeholder="Search events" aria-label="Search events" className={`${sel} min-w-[200px] flex-1`} />
          <select name="kind" defaultValue={kind ?? ""} aria-label="Type" className={sel}><option value="">Any type</option>{EVENT_KINDS.map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}</select>
          <select name="mode" defaultValue={mode ?? ""} aria-label="Online or in person" className={sel}><option value="">Online or in person</option>{Object.entries(MODE_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          <input name="city" defaultValue={city} placeholder="City" aria-label="City" className={`${sel} w-36`} />
          <button className="h-11 rounded-lg bg-primary px-5 font-semibold text-on-primary">Find</button>
        </form>
        <p className="mb-4 flex flex-wrap items-center gap-4 text-sm text-ink-soft"><span aria-live="polite">{events.length} upcoming</span><Link href="/calendar" className="font-semibold text-accent underline">Open the calendar</Link>{canPost && <Link href="/dashboard/events" className="font-semibold text-accent underline">Post an event</Link>}</p>
        {down && <p role="status" className="card mb-6 p-4 text-sm text-ink-soft">Events are temporarily unavailable. Please check back in a few minutes.</p>}
        {events.length ? (
          <ul className="grid gap-6 sm:grid-cols-2">{events.map((e) => (
            <li key={e.id} className="card flex flex-col p-6">
              <div className="flex flex-wrap items-center gap-2"><Badge tone="accent">{KIND_LABEL[e.kind as keyof typeof KIND_LABEL] ?? "Event"}</Badge><Badge>{MODE_LABEL[e.mode]}</Badge><Badge tone={e.free ? "accent" : "neutral"}>{priceLabel(e)}</Badge></div>
              <h2 className="mt-3 text-xl font-bold"><Link href={`/events/${e.id}`} className="hover:underline">{e.title}</Link></h2>
              <p className="mt-1 text-sm text-ink-soft">{e.organiserName}</p>
              <p className="mt-3 text-sm font-semibold">{fmtWhen(e.startsAt, e.endsAt)}</p>
              <p className="text-sm text-ink-soft">{e.location}{e.capacity ? ` · ${e.capacity} places` : ""}{e._count.rsvps ? ` · ${e._count.rsvps} going` : ""}</p>
              <Link href={`/events/${e.id}`} className="mt-4 inline-flex h-10 w-fit items-center rounded-full border border-line px-5 text-sm font-semibold hover:border-accent">View and RSVP</Link>
            </li>))}</ul>
        ) : !down && (
          <div className="card p-10 text-center" data-testid="no-events">
            <h2 className="text-xl font-bold">{q || kind || mode || city ? "No events match those filters" : "No events are scheduled right now"}</h2>
            <p className="mx-auto mt-2 max-w-xl text-ink-soft">{q || kind || mode || city ? <>Try widening them or <Link href="/events" className="text-accent underline">reset</Link>.</> : "Verified colleges, employers and mentors publish events here. Check back soon, or open the calendar to see listing deadlines."}</p>
          </div>
        )}
      </Block>
    </>
  );
}
