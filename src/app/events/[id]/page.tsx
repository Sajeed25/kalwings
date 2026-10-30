import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getUser } from "@/lib/session";
import { Block } from "@/components/pages/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActionButton, ActionForm, Area } from "@/components/dash/action-form";
import { SharePanel } from "@/components/share-panel";
import { cancelEvent, cancelRsvp, hideEvent, rsvpEvent } from "@/app/actions/events";
import { reportContent } from "@/app/actions/common";
import { KIND_LABEL, MODE_LABEL, fmtWhen, priceLabel } from "@/lib/events";
import { googleCalendarUrl, mapsUrl } from "@/lib/calendar";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";
const load = (id: string) => db.event.findUnique({ where: { id }, include: { rsvps: { include: { user: { select: { id: true, name: true } } }, orderBy: { createdAt: "asc" }, take: 500 } } });

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const e = await load((await params).id);
  if (!e || e.status === "HIDDEN") return { title: "Event" };
  const d = `${KIND_LABEL[e.kind as keyof typeof KIND_LABEL] ?? "Event"} · ${fmtWhen(e.startsAt, e.endsAt)} · ${MODE_LABEL[e.mode]} · ${priceLabel(e)} · ${e.organiserName}`;
  return { title: e.title, description: d, openGraph: { title: e.title, description: d } };
}

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ src?: string }> }) {
  const { id } = await params; void (await searchParams);
  const e = await load(id); const user = await getUser();
  const isOwner = !!user && (user.id === e?.organiserId || user.role === "PLATFORM_ADMIN");
  if (!e || (e.status === "HIDDEN" && !isOwner)) notFound();
  const going = !!user && e.rsvps.some((r) => r.user.id === user.id);
  const over = e.startsAt.getTime() < Date.now() - 2 * 3600_000, cancelled = e.status === "CANCELLED", full = !!e.capacity && e.rsvps.length >= e.capacity;
  const here = `/events/${e.id}`, enc = encodeURIComponent(here);
  const url = `${site.url}${here}`;
  const cal = { uid: `event-${e.id}`, title: e.title, start: e.startsAt, end: e.endsAt, location: e.location, description: `${e.organiserName} · ${priceLabel(e)}`, url };
  const ld = { "@context": "https://schema.org", "@type": "Event", name: e.title, startDate: e.startsAt.toISOString(), ...(e.endsAt ? { endDate: e.endsAt.toISOString() } : {}), eventStatus: cancelled ? "https://schema.org/EventCancelled" : "https://schema.org/EventScheduled",
    eventAttendanceMode: e.mode === "REMOTE" ? "https://schema.org/OnlineEventAttendanceMode" : e.mode === "HYBRID" ? "https://schema.org/MixedEventAttendanceMode" : "https://schema.org/OfflineEventAttendanceMode",
    location: e.mode === "REMOTE" ? { "@type": "VirtualLocation", url } : { "@type": "Place", name: e.location, address: e.location }, organizer: { "@type": "Organization", name: e.organiserName }, description: e.description.slice(0, 300), isAccessibleForFree: e.free, url };
  return (
    <Block>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <Link href="/events" className="text-sm font-semibold text-accent">← All events</Link>
      <div className="mt-6 max-w-3xl">
        <div className="flex flex-wrap items-center gap-2"><Badge tone="accent">{KIND_LABEL[e.kind as keyof typeof KIND_LABEL] ?? "Event"}</Badge><Badge>{MODE_LABEL[e.mode]}</Badge><Badge tone={e.free ? "accent" : "neutral"}>{priceLabel(e)}</Badge>{cancelled && <Badge tone="spot">Cancelled</Badge>}{e.status === "HIDDEN" && <Badge tone="spot">Hidden by an admin</Badge>}</div>
        <h1 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">{e.title}</h1>
        <p className="mt-3 text-lg text-ink-soft">By <span className="text-ink">{e.organiserName}</span></p>
        <dl className="card mt-8 grid gap-6 p-7 sm:grid-cols-2">
          {([["When", fmtWhen(e.startsAt, e.endsAt)], ["Where", `${MODE_LABEL[e.mode]} · ${e.location}`], ["Price", priceLabel(e)], ["Going", `${e.rsvps.length}${e.capacity ? ` of ${e.capacity} places` : ""}`]] as [string, string][]).map(([k, v]) => <div key={k}><dt className="text-sm text-ink-soft">{k}</dt><dd className="font-semibold">{v}</dd></div>)}
        </dl>
        <p className="mt-6 whitespace-pre-line text-ink-soft">{e.description}</p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          {cancelled ? <Badge>This event was cancelled</Badge> : over ? <Badge>This event has ended</Badge>
            : !user ? <><Button asChild size="lg"><Link href={`/login?next=${enc}`}>Log in to RSVP</Link></Button><Button asChild size="lg" variant="secondary"><Link href={`/join?role=STUDENT&next=${enc}`}>New here? Create a free account</Link></Button></>
            : going ? <><Badge tone="accent">You&apos;re going ✓</Badge><ActionButton variant="secondary" size="md" action={cancelRsvp.bind(null, e.id)}>Cancel my RSVP</ActionButton></>
            : full ? <Badge>This event is full</Badge>
            : <ActionButton variant="primary" size="md" action={rsvpEvent.bind(null, e.id)}>RSVP: I&apos;m going</ActionButton>}
        </div>
        {going && !cancelled && e.mode !== "ONSITE" && e.joinUrl && <p className="mt-4 rounded-xl border border-line p-4 text-sm"><b>Joining link:</b> <a href={e.joinUrl} target="_blank" rel="noopener noreferrer nofollow" className="break-all text-accent underline">{e.joinUrl}</a><br /><span className="text-ink-soft">Shown only to people who RSVP. Don&apos;t share it.</span></p>}
        {!cancelled && <p className="mt-4 flex flex-wrap gap-4 text-sm"><a href={googleCalendarUrl(cal)} target="_blank" rel="noopener noreferrer" className="font-semibold text-accent underline">Add to Google Calendar</a><a href={`/api/events/${e.id}/ics`} className="font-semibold text-accent underline">Download calendar file (.ics)</a>{e.mode !== "REMOTE" && <a href={mapsUrl(e.location)} target="_blank" rel="noopener noreferrer" className="font-semibold text-accent underline">View on map</a>}</p>}
        {isOwner && (
          <section aria-label="Organiser tools" className="card mt-8 p-5 text-sm"><h2 className="text-lg font-bold">Organiser tools</h2>
            <p className="mt-1 text-ink-soft">{e.rsvps.length} going{e.rsvps.length ? ": " + e.rsvps.slice(0, 40).map((r) => r.user.name).join(", ") + (e.rsvps.length > 40 ? ", …" : "") : "."} Contact details are never shown.</p>
            <div className="mt-3 flex flex-wrap gap-2">{!cancelled && <ActionButton variant="secondary" confirm="Cancel this event and tell everyone who RSVPed?" action={cancelEvent.bind(null, e.id)}>Cancel event</ActionButton>}{user?.role === "PLATFORM_ADMIN" && <ActionButton variant="secondary" action={hideEvent.bind(null, e.id, e.status !== "HIDDEN")}>{e.status === "HIDDEN" ? "Show again" : "Hide from the public"}</ActionButton>}</div>
          </section>)}
        {e.status === "LIVE" && <SharePanel title={e.title} company={e.organiserName} details={`${KIND_LABEL[e.kind as keyof typeof KIND_LABEL] ?? "Event"} · ${fmtWhen(e.startsAt, e.endsAt)} · ${MODE_LABEL[e.mode]} · ${e.location} · ${priceLabel(e)}`} link={e.shortCode ? `${site.url}/e/${e.shortCode}` : url} heading="Invite friends to this event" />}
        {user && <details className="mt-10 text-sm"><summary className="cursor-pointer font-semibold text-ink-soft">Report this event</summary>
          <ActionForm action={reportContent} reset submit="Send report" success="Thanks, our team will review it." className="mt-3 max-w-md space-y-3"><input type="hidden" name="targetType" value="EVENT" /><input type="hidden" name="targetId" value={e.id} /><Area label="What's wrong?" name="reason" required minLength={10} maxLength={500} /></ActionForm></details>}
      </div>
    </Block>
  );
}
