import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/session";
import { Empty, PageTitle, Panel, Status } from "@/components/dash/ui";
import { ActionButton, ActionForm, Area, Field, inputCls } from "@/components/dash/action-form";
import { cancelEvent, createEvent, hideEvent } from "@/app/actions/events";
import { EVENT_KINDS, KIND_LABEL, MODE_LABEL, fmtWhen, priceLabel } from "@/lib/events";

export default async function Page() {
  const u = await requirePageRole("EMPLOYER", "COLLEGE_ADMIN", "MENTOR", "PLATFORM_ADMIN");
  const admin = u.role === "PLATFORM_ADMIN";
  const events = await db.event.findMany({ where: admin ? {} : { organiserId: u.id }, orderBy: { startsAt: "desc" }, take: 60, include: { _count: { select: { rsvps: true } } } });
  const lbl = "block text-sm font-semibold";
  return (
    <>
      <PageTitle title="Events" sub="Post a webinar, workshop, hackathon or meetup for students. It goes live at once because you are verified. Time, place and price are always shown, and the joining link is shown only to people who RSVP." />
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <Panel title={admin ? "All events" : "Your events"}>
          {events.length ? <ul className="divide-y divide-line">{events.map((e) => (
            <li key={e.id} className="py-4"><div className="flex flex-wrap items-start justify-between gap-3">
              <div><Link href={`/events/${e.id}`} className="font-semibold text-accent underline-offset-2 hover:underline">{e.title}</Link><p className="text-sm text-ink-soft">{KIND_LABEL[e.kind as keyof typeof KIND_LABEL] ?? "Event"} · {fmtWhen(e.startsAt, e.endsAt)} · {MODE_LABEL[e.mode]} · {priceLabel(e)}{admin && <> · {e.organiserName}</>}</p><p className="text-sm text-ink-soft">{e._count.rsvps} going</p></div>
              <div className="flex items-center gap-2">{e.status !== "LIVE" && <Status s={e.status === "CANCELLED" ? "REJECTED" : "PENDING"} />}{e.status === "LIVE" && <ActionButton confirm="Cancel this event and tell everyone who RSVPed?" action={cancelEvent.bind(null, e.id)}>Cancel</ActionButton>}{admin && <ActionButton action={hideEvent.bind(null, e.id, e.status !== "HIDDEN")}>{e.status === "HIDDEN" ? "Show" : "Hide"}</ActionButton>}</div>
            </div></li>))}</ul> : <Empty>No events yet. Post the first one.</Empty>}
        </Panel>
        <Panel title="Post an event">
          <ActionForm action={createEvent} reset submit="Post event" success="Posted. It is live now." className="space-y-3">
            <Field label="Title" name="title" required maxLength={140} />
            <label className={lbl}>Type<select name="kind" className={inputCls + " h-11"}>{EVENT_KINDS.map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}</select></label>
            <Area label="What happens, and who is it for?" name="description" required minLength={30} maxLength={3000} />
            <Field label="Starts (IST)" name="startsAt" type="datetime-local" required />
            <Field label="Ends (IST, optional)" name="endsAt" type="datetime-local" />
            <label className={lbl}>Format<select name="mode" className={inputCls + " h-11"}>{Object.entries(MODE_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
            <Field label="Where" name="location" required maxLength={160} hint="City and venue, or “Online”." />
            <Field label="Joining link (online or hybrid)" name="joinUrl" type="url" maxLength={400} hint="Only people who RSVP can see it." />
            <label className={lbl}>Price<select name="price" className={inputCls + " h-11"}><option value="FREE">Free</option><option value="PAID">Paid</option></select></label>
            <Field label="If paid: what it costs" name="priceText" maxLength={80} hint="For example “₹299 per person”. Always shown to students." />
            <Field label="Places (optional)" name="capacity" type="number" min={1} max={100000} />
          </ActionForm>
        </Panel>
      </div>
    </>
  );
}
