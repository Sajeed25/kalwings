/** Calendar helpers (pure). `.ics` files open in any calendar app; the Google link needs no key and sends nothing to us. */
export const icsEscape = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
export const icsStamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const icsDay = (d: Date) => icsStamp(d).slice(0, 8);
const fold = (line: string) => { const out: string[] = []; let l = line; while (l.length > 73) { out.push(l.slice(0, 73)); l = " " + l.slice(73); } out.push(l); return out.join("\r\n"); };

export type CalItem = { uid: string; title: string; start: Date; end?: Date | null; allDay?: boolean; location?: string; description?: string; url?: string };

export function buildIcs(i: CalItem): string {
  const end = i.end ?? (i.allDay ? new Date(i.start.getTime() + 86_400_000) : new Date(i.start.getTime() + 60 * 60_000));
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Kalwings//Calendar//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "BEGIN:VEVENT", `UID:${i.uid}@kalwings`, `DTSTAMP:${icsStamp(new Date())}`,
    i.allDay ? `DTSTART;VALUE=DATE:${icsDay(i.start)}` : `DTSTART:${icsStamp(i.start)}`, i.allDay ? `DTEND;VALUE=DATE:${icsDay(end)}` : `DTEND:${icsStamp(end)}`, `SUMMARY:${icsEscape(i.title)}`];
  if (i.location) lines.push(`LOCATION:${icsEscape(i.location)}`);
  const desc = [i.description, i.url].filter(Boolean).join("\n"); if (desc) lines.push(`DESCRIPTION:${icsEscape(desc)}`);
  if (i.url) lines.push(`URL:${i.url}`);
  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}

export function googleCalendarUrl(i: CalItem): string {
  const end = i.end ?? (i.allDay ? new Date(i.start.getTime() + 86_400_000) : new Date(i.start.getTime() + 60 * 60_000));
  const dates = i.allDay ? `${icsDay(i.start)}/${icsDay(end)}` : `${icsStamp(i.start)}/${icsStamp(end)}`;
  const q = new URLSearchParams({ action: "TEMPLATE", text: i.title, dates, details: [i.description, i.url].filter(Boolean).join("\n"), ...(i.location ? { location: i.location } : {}) });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

/** A search link for a place. Opens Google Maps in a new tab; nothing is sent until the person clicks. */
export const mapsUrl = (place: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`;
