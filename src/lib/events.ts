/** Event helpers (pure). Times are shown in IST because our users are in India. */
export const EVENT_KINDS = ["WEBINAR", "WORKSHOP", "HACKATHON", "MEETUP", "CAMPUS", "OTHER"] as const;
export type EventKind = (typeof EVENT_KINDS)[number];
export const KIND_LABEL: Record<EventKind, string> = { WEBINAR: "Webinar", WORKSHOP: "Workshop", HACKATHON: "Hackathon", MEETUP: "Meetup", CAMPUS: "Campus event", OTHER: "Event" };
export const MODE_LABEL = { REMOTE: "Online", HYBRID: "Hybrid", ONSITE: "In person" } as const;

const opt = { timeZone: "Asia/Kolkata" } as const;
export function fmtWhen(start: Date, end?: Date | null): string {
  const day = start.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric", ...opt });
  const t = (d: Date) => d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, ...opt }).toLowerCase();
  const sameDay = end && end.toLocaleDateString("en-IN", opt) === start.toLocaleDateString("en-IN", opt);
  return `${day} · ${t(start)}${end ? sameDay ? ` to ${t(end)}` : ` to ${end.toLocaleDateString("en-IN", { day: "numeric", month: "short", ...opt })}, ${t(end)}` : ""} IST`;
}
export const priceLabel = (e: { free: boolean; priceText: string | null }) => (e.free ? "Free" : e.priceText || "Paid");
