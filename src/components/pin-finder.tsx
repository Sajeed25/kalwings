"use client";
import Link from "next/link";
import { useState } from "react";

type Found = { place: { district: string; area: string; state: string }; city: { name: string; slug: string; count: number } | null };

/** Type a PIN code, get the district and any open listings there. The lookup runs on our server, not in the browser. */
export function PinFinder() {
  const [pin, setPin] = useState(""), [busy, setBusy] = useState(false), [err, setErr] = useState<string>(), [found, setFound] = useState<Found>();
  async function look(e: React.FormEvent) {
    e.preventDefault(); setErr(undefined); setFound(undefined);
    if (!/^[1-9][0-9]{5}$/.test(pin)) return setErr("Enter a 6-digit PIN code.");
    setBusy(true);
    try {
      const r = await fetch(`/api/pincode/${pin}`); const j = await r.json();
      if (!r.ok) setErr(j.error ?? "Could not look that up."); else setFound(j);
    } catch { setErr("Could not look that up. Pick your city from the list instead."); }
    setBusy(false);
  }
  return (
    <div className="mb-8">
      <form onSubmit={look} className="flex flex-wrap items-end gap-3" aria-label="Find by PIN code">
        <label className="block text-sm font-semibold">Find by PIN code
          <input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="postal-code" placeholder="e.g. 500081" className="mt-1 block h-11 w-44 rounded-xl border border-line bg-surface px-3 font-normal" />
        </label>
        <button disabled={busy} className="h-11 rounded-full bg-primary px-6 text-sm font-bold text-on-primary">{busy ? "Looking…" : "Find"}</button>
      </form>
      <div role="status" aria-live="polite" className="mt-3 text-sm">
        {err && <p role="alert" className="text-danger">{err}</p>}
        {found && <p>{found.place.area ? `${found.place.area}, ` : ""}{found.place.district}, {found.place.state}. {found.city ? <>There {found.city.count === 1 ? "is 1 open listing" : `are ${found.city.count} open listings`} in {found.city.name}: <Link href={`/jobs-in/${found.city.slug}`} className="font-semibold text-accent underline">see them</Link>.</> : <>Nothing is open in {found.place.district} right now. <Link href={`/opportunities?location=${encodeURIComponent(found.place.district)}`} className="font-semibold text-accent underline">Search nearby anyway</Link>, or <Link href="/jobs-in" className="font-semibold text-accent underline">pick another city</Link>.</>}</p>}
      </div>
    </div>
  );
}
