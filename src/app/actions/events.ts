"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireActionRole } from "@/lib/session";
import { audit, notify } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";
import { fail, obj, type Result } from "./_shared";
import { istDateTime } from "@/lib/validation";
import { EVENT_KINDS } from "@/lib/events";
import { uniqueEventCode } from "@/lib/short-code";

const text = (max: number) => z.string().trim().max(max);
export type EventResult = Result & { note?: string };

const eventSchema = z.object({
  title: text(140).min(3, "Give the event a title"),
  kind: z.enum(EVENT_KINDS),
  description: text(3000).min(30, "Describe the event in at least 30 characters: what happens, who it is for"),
  startsAt: istDateTime.refine((d) => d.getTime() > Date.now(), "Pick a start time in the future"),
  endsAt: z.union([z.literal(""), istDateTime]).optional().transform((v) => (v === "" || v === undefined ? undefined : v)),
  mode: z.enum(["REMOTE", "HYBRID", "ONSITE"]),
  location: text(160).min(2, "Say where it is (a city and venue, or 'Online')"),
  joinUrl: z.union([z.literal(""), z.string().trim().url().max(400).refine((u) => /^https?:\/\//.test(u), "The link must start with http:// or https://")]).optional(),
  price: z.enum(["FREE", "PAID"]),
  priceText: text(80).optional().default(""),
  capacity: z.union([z.literal(""), z.coerce.number().int().min(1).max(100000)]).optional().transform((v) => (v === "" || v === undefined ? undefined : v)),
}).refine((e) => e.price === "FREE" || e.priceText.length >= 2, { message: "Say what it costs, for example “₹299 per person”", path: ["priceText"] })
  .refine((e) => !e.endsAt || e.endsAt.getTime() > e.startsAt.getTime(), { message: "The end must be after the start", path: ["endsAt"] })
  .refine((e) => e.mode === "ONSITE" || !!e.joinUrl, { message: "Add the joining link for an online or hybrid event", path: ["joinUrl"] });

/** Who may post, and the name shown as the organiser. Only verified organisations, verified mentors and admins. */
async function organiser(u: { id: string; name: string; role: string }): Promise<{ name: string } | { error: string }> {
  if (u.role === "PLATFORM_ADMIN") return { name: "Kalwings" };
  if (u.role === "EMPLOYER") { const m = await db.employerMember.findUnique({ where: { userId: u.id }, include: { company: true } }); return m?.company.status === "VERIFIED" ? { name: m.company.name } : { error: "Your company must be verified before you can post events." }; }
  if (u.role === "COLLEGE_ADMIN") { const m = await db.collegeAdmin.findUnique({ where: { userId: u.id }, include: { college: true } }); return m?.college.status === "VERIFIED" ? { name: m.college.name } : { error: "Your college must be verified before you can post events." }; }
  if (u.role === "MENTOR") { const m = await db.mentorProfile.findUnique({ where: { userId: u.id } }); return m?.status === "VERIFIED" ? { name: `${u.name} (mentor)` } : { error: "Your mentor profile must be verified before you can post events." }; }
  return { error: "Only verified employers, colleges, mentors and admins can post events." };
}

export async function createEvent(_: EventResult, fd: FormData): Promise<EventResult> {
  const u = await requireActionRole("EMPLOYER", "COLLEGE_ADMIN", "MENTOR", "PLATFORM_ADMIN");
  const r = eventSchema.safeParse(obj(fd));
  if (!r.success) return fail(r.error);
  const org = await organiser(u); if ("error" in org) return { error: org.error };
  if (!(await rateLimit(`event:${u.id}`, 10, 24 * 60 * 60 * 1000))) return { error: "You have posted 10 events today. Try again tomorrow." };
  const d = r.data;
  const e = await db.event.create({ data: { title: d.title, kind: d.kind, description: d.description, startsAt: d.startsAt, endsAt: d.endsAt ?? null, mode: d.mode, location: d.location, joinUrl: d.joinUrl || null, organiserId: u.id, organiserName: org.name, free: d.price === "FREE", priceText: d.price === "PAID" ? d.priceText : null, capacity: d.capacity ?? null, shortCode: await uniqueEventCode() } });
  await audit(u.id, "event.created", `${d.title} (${e.id})`.slice(0, 190));
  revalidatePath("/events"); revalidatePath("/calendar"); revalidatePath("/dashboard", "layout");
  return { ok: true, note: "Posted. It is live now on the Events page." };
}

async function manageable(id: string) {
  const u = await requireActionRole("EMPLOYER", "COLLEGE_ADMIN", "MENTOR", "PLATFORM_ADMIN");
  const e = await db.event.findUnique({ where: { id } });
  if (!e || (u.role !== "PLATFORM_ADMIN" && e.organiserId !== u.id)) throw new Error("Not found");
  return { u, e };
}

export async function cancelEvent(id: string) {
  const { u, e } = await manageable(id);
  if (e.status === "CANCELLED") return;
  await db.event.update({ where: { id }, data: { status: "CANCELLED" } });
  const rs = await db.eventRsvp.findMany({ where: { eventId: id }, select: { userId: true }, take: 2000 });
  await Promise.all(rs.map((r) => notify(r.userId, "Event cancelled", `${e.title} has been cancelled by the organiser.`)));
  await audit(u.id, "event.cancelled", `${e.title} (${id})`.slice(0, 190));
  revalidatePath("/events"); revalidatePath(`/events/${id}`); revalidatePath("/dashboard", "layout");
}

/** Admins can hide an event that breaks the rules (and show it again). */
export async function hideEvent(id: string, hide: boolean) {
  const u = await requireActionRole("PLATFORM_ADMIN");
  const e = await db.event.update({ where: { id }, data: { status: hide ? "HIDDEN" : "LIVE" } });
  await audit(u.id, hide ? "event.hidden" : "event.unhidden", `${e.title} (${id})`.slice(0, 190));
  revalidatePath("/events"); revalidatePath(`/events/${id}`); revalidatePath("/dashboard", "layout");
}

export async function rsvpEvent(id: string) {
  const u = await requireActionRole();
  const e = await db.event.findUnique({ where: { id }, include: { _count: { select: { rsvps: true } } } });
  if (!e || e.status !== "LIVE" || e.startsAt.getTime() < Date.now() - 2 * 3600_000) throw new Error("This event is not open for RSVPs.");
  const has = await db.eventRsvp.findUnique({ where: { eventId_userId: { eventId: id, userId: u.id } } });
  if (!has) {
    if (e.capacity && e._count.rsvps >= e.capacity) throw new Error("This event is full.");
    await db.eventRsvp.create({ data: { eventId: id, userId: u.id } });
    await notify(e.organiserId, "New RSVP", `${u.name} is coming to ${e.title}`);
  }
  revalidatePath(`/events/${id}`); revalidatePath("/dashboard", "layout");
}

export async function cancelRsvp(id: string) {
  const u = await requireActionRole();
  await db.eventRsvp.deleteMany({ where: { eventId: id, userId: u.id } });
  revalidatePath(`/events/${id}`); revalidatePath("/dashboard", "layout");
}
