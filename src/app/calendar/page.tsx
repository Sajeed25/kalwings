import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { Serif } from "@/components/ui/serif";
import { PageHero, Block } from "@/components/pages/shell";
import { KIND_LABEL, MODE_LABEL, fmtWhen } from "@/lib/events";

export const metadata: Metadata = { title: "Calendar: deadlines and events", description: "Application deadlines and events for freshers over the next two months, in one place." };
export const dynamic = "force-dynamic";
const DAY = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Kolkata" });
const key = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

type Item = { at: Date; kind: "deadline" | "event"; title: string; sub: string; href: string };

export default async function Page() {
  const now = new Date(), until = new Date(now.getTime() + 60 * 86_400_000);
  let items: Item[] = []; let down = false;
  try {
    const [opps, events] = await Promise.all([
      db.opportunity.findMany({ where: { moderated: "VERIFIED", closedAt: null, deadline: { gt: now, lte: until }, company: { status: "VERIFIED", members: { none: { user: { suspendedAt: { not: null } } } } } }, include: { company: true }, orderBy: { deadline: "asc" }, take: 120 }),
      db.event.findMany({ where: { status: "LIVE", startsAt: { gte: now, lte: until } }, orderBy: { startsAt: "asc" }, take: 120 }),
    ]);
    items = [
      ...opps.map((o): Item => ({ at: o.deadline, kind: "deadline", title: `Apply by: ${o.title}`, sub: `${o.company.name} · ${o.location} · ${o.payText}${o.unpaid ? " (unpaid)" : ""}`, href: `/opportunities/${o.id}` })),
      ...events.map((e): Item => ({ at: e.startsAt, kind: "event", title: e.title, sub: `${KIND_LABEL[e.kind as keyof typeof KIND_LABEL] ?? "Event"} · ${fmtWhen(e.startsAt, e.endsAt)} · ${MODE_LABEL[e.mode]} · ${e.organiserName}`, href: `/events/${e.id}` })),
    ].sort((a, b) => a.at.getTime() - b.at.getTime());
  } catch (e) { down = true; console.error("[calendar] load failed:", e instanceof Error ? e.message : e); }
  const days = new Map<string, Item[]>(); for (const i of items) { const k = key(i.at); days.set(k, [...(days.get(k) ?? []), i]); }
  return (
    <>
      <PageHero eyebrow="Calendar" title={<>What is <Serif>coming up</Serif>.</>} lead="Application deadlines and events for the next two months. Open any item to add it to your own calendar." />
      <Block>
        <p className="mb-6 flex flex-wrap gap-4 text-sm"><Link href="/events" className="font-semibold text-accent underline">All events</Link><Link href="/opportunities" className="font-semibold text-accent underline">All opportunities</Link></p>
        {down && <p role="status" className="card mb-6 p-4 text-sm text-ink-soft">The calendar is temporarily unavailable. Please check back in a few minutes.</p>}
        {days.size ? (
          <ol className="space-y-8">{[...days.entries()].map(([k, list]) => (
            <li key={k}><h2 className="text-lg font-bold">{DAY.format(list[0].at)}</h2>
              <ul className="mt-3 space-y-2">{list.map((i) => (
                <li key={i.href + i.kind} className="card flex flex-wrap items-center justify-between gap-3 p-4"><div><Link href={i.href} className="font-semibold hover:underline">{i.title}</Link><p className="text-sm text-ink-soft">{i.sub}</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${i.kind === "event" ? "bg-mint text-black" : "bg-sun text-black"}`}>{i.kind === "event" ? "Event" : "Deadline"}</span></li>))}</ul></li>))}</ol>
        ) : !down && <div className="card p-10 text-center" data-testid="calendar-empty"><h2 className="text-xl font-bold">Nothing is scheduled yet</h2><p className="mx-auto mt-2 max-w-xl text-ink-soft">Deadlines appear as employers publish roles, and events as colleges, employers and mentors post them.</p></div>}
      </Block>
    </>
  );
}
