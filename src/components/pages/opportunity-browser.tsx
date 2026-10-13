"use client";
import { useMemo, useState } from "react";
import { OpportunityCard } from "@/components/home/opportunities";
import type { Opportunity } from "@/data/sample";

const sel = "h-11 w-full rounded-xl border border-line bg-surface px-3 text-[15px]";

export function OpportunityBrowser({ items: opportunities, initialQ = "", initialLocation = "" }: { items: Opportunity[]; initialQ?: string; initialLocation?: string }) {
  const [q, setQ] = useState(initialQ);
  const [loc, setLoc] = useState(initialLocation);
  const [type, setType] = useState("");
  const [mode, setMode] = useState("");
  const [pay, setPay] = useState("");
  const [year, setYear] = useState("");
  const [min, setMin] = useState(0);

  const list = useMemo(() => opportunities.filter((o) => {
    const hay = `${o.role} ${o.company} ${o.skills.join(" ")}`.toLowerCase();
    return (!q || hay.includes(q.toLowerCase()))
      && (!loc || `${o.location} ${o.mode}`.toLowerCase().includes(loc.toLowerCase()))
      && (!type || o.type === type) && (!mode || o.mode === mode)
      && (!pay || (pay === "unpaid") === o.unpaid)
      && (!year || o.eligibility.includes(year) || o.eligibility.includes("Any"))
      && o.monthly >= min;
  }), [opportunities, q, loc, type, mode, pay, year, min]);

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      <form role="search" aria-label="Filter opportunities" onSubmit={(e) => e.preventDefault()} className="card h-fit space-y-4 p-5 lg:sticky lg:top-24">
        <label className="block text-sm font-semibold">Role, skill or company<input className={sel + " mt-1.5"} value={q} onChange={(e) => setQ(e.target.value)} /></label>
        <label className="block text-sm font-semibold">Location<input className={sel + " mt-1.5"} value={loc} onChange={(e) => setLoc(e.target.value)} placeholder="City or Remote" /></label>
        <label className="block text-sm font-semibold">Type<select className={sel + " mt-1.5"} value={type} onChange={(e) => setType(e.target.value)}><option value="">All</option><option>Internship</option><option>Job</option><option>Challenge</option></select></label>
        <label className="block text-sm font-semibold">Work mode<select className={sel + " mt-1.5"} value={mode} onChange={(e) => setMode(e.target.value)}><option value="">Any</option><option>Remote</option><option>Hybrid</option><option>On-site</option></select></label>
        <label className="block text-sm font-semibold">Pay<select className={sel + " mt-1.5"} value={pay} onChange={(e) => setPay(e.target.value)}><option value="">Paid &amp; unpaid</option><option value="paid">Paid only</option><option value="unpaid">Unpaid only</option></select></label>
        <label className="block text-sm font-semibold">Graduation year<select className={sel + " mt-1.5"} value={year} onChange={(e) => setYear(e.target.value)}><option value="">Any</option>{["2025", "2026", "2027"].map((y) => <option key={y}>{y}</option>)}</select></label>
        <label className="block text-sm font-semibold">Min. monthly pay: ₹{min.toLocaleString("en-IN")}
          <input type="range" min={0} max={60000} step={5000} value={min} onChange={(e) => setMin(+e.target.value)} className="mt-2 w-full accent-neon" />
        </label>
      </form>
      <div>
        <h2 className="sr-only">Results</h2>
        <p className="mb-4 text-sm text-ink-soft" aria-live="polite">{list.length} {list.length === 1 ? "opportunity" : "opportunities"}</p>
        {list.length ? <ul className="grid gap-6 sm:grid-cols-2">{list.map((o) => <li key={o.id}><OpportunityCard o={o} /></li>)}</ul>
          : <p className="card p-10 text-center text-ink-soft">Nothing matches those filters yet. Try widening them.</p>}
      </div>
    </div>
  );
}
