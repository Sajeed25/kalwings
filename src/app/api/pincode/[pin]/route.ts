import { NextResponse } from "next/server";
import { clientIp } from "@/lib/request";
import { rateLimit } from "@/lib/rate-limit";
import { parsePin, validPin } from "@/lib/pincode";
import { liveCities, citySlug } from "@/lib/cities";

const cache = new Map<string, { at: number; v: unknown }>();

/** Looks a 6-digit PIN up with India Post (server side only, with a short timeout) and says whether Kalwings has open listings in that district. */
export async function GET(_req: Request, { params }: { params: Promise<{ pin: string }> }) {
  const pin = (await params).pin;
  if (!validPin(pin)) return NextResponse.json({ error: "Enter a 6-digit PIN code." }, { status: 400 });
  if (!(await rateLimit(`pin:${await clientIp()}`, 30, 3_600_000))) return NextResponse.json({ error: "Too many lookups. Try again later." }, { status: 429 });
  const hit = cache.get(pin);
  let place = hit && Date.now() - hit.at < 86_400_000 ? (hit.v as ReturnType<typeof parsePin>) : undefined;
  if (place === undefined) {
    try {
      const r = await fetch(`https://api.postalpincode.in/pincode/${pin}`, { signal: AbortSignal.timeout(4000), cache: "no-store" });
      if (!r.ok) throw new Error(String(r.status));
      place = parsePin(await r.json());
      if (cache.size > 500) cache.clear();
      cache.set(pin, { at: Date.now(), v: place });
    } catch { return NextResponse.json({ error: "The PIN code service is not answering. Pick your city from the list instead." }, { status: 503 }); }
  }
  if (!place) return NextResponse.json({ error: "No place found for that PIN code." }, { status: 404 });
  let city: { name: string; slug: string; count: number } | null = null;
  try { const slug = citySlug(place.district); city = (await liveCities()).find((c) => c.slug === slug) ?? null; } catch { /* listings lookup is optional */ }
  return NextResponse.json({ place, city });
}
