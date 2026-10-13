import Link from "next/link";
import { OpportunityCard } from "@/components/home/opportunities";
import { TYPE_KEYS, TYPE_LABEL } from "@/lib/opportunity-types";
import { SORTS, type OppQuery } from "@/lib/public-data";
import type { Opportunity } from "@/data/sample";

const sel = "h-11 w-full rounded-lg border border-line bg-surface px-3 text-[15px]";
const lbl = "block text-sm font-semibold";

function href(p: OppQuery, page: number) {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) if (v !== undefined && v !== "" && v !== 0 && k !== "page") u.set(k, String(v));
  if (page > 1) u.set("page", String(page));
  const s = u.toString();
  return s ? `/opportunities?${s}` : "/opportunities";
}

/** Server-rendered, URL-driven filters: shareable, works without JavaScript, and paginates in the database layer. */
export function OpportunityBrowser({ items, total, page, pages, query }: { items: Opportunity[]; total: number; page: number; pages: number; query: OppQuery }) {
  return (
    <div className="grid gap-8 lg:grid-cols-[290px_1fr]">
      <form method="get" action="/opportunities" role="search" aria-label="Filter opportunities" className="card h-fit space-y-4 p-5 lg:sticky lg:top-24">
        <label className={lbl}>Role, company or keyword<input name="q" defaultValue={query.q} className={sel + " mt-1.5"} /></label>
        <label className={lbl}>Skill<input name="skill" defaultValue={query.skill} placeholder="e.g. React, SQL" className={sel + " mt-1.5"} /></label>
        <label className={lbl}>Type
          <select name="type" defaultValue={query.type ?? ""} className={sel + " mt-1.5"}><option value="">All types</option>{TYPE_KEYS.map((k) => <option key={k} value={k}>{TYPE_LABEL[k]}</option>)}</select>
        </label>
        <label className={lbl}>Employer<input name="employer" defaultValue={query.employer} className={sel + " mt-1.5"} /></label>
        <label className={lbl}>Location<input name="location" defaultValue={query.location} placeholder="City" className={sel + " mt-1.5"} /></label>
        <label className={lbl}>Work mode
          <select name="mode" defaultValue={query.mode ?? ""} className={sel + " mt-1.5"}><option value="">Any</option><option value="REMOTE">Remote</option><option value="HYBRID">Hybrid</option><option value="ONSITE">On-site</option></select>
        </label>
        <label className={lbl}>Pay
          <select name="pay" defaultValue={query.pay ?? ""} className={sel + " mt-1.5"}><option value="">Paid &amp; unpaid</option><option value="paid">Paid only</option><option value="unpaid">Unpaid only</option></select>
        </label>
        <label className={lbl}>Min. monthly pay (₹)<input name="min" type="number" min={0} step={5000} defaultValue={query.min || ""} className={sel + " mt-1.5"} /></label>
        <label className={lbl}>Graduation year
          <select name="year" defaultValue={query.year ?? ""} className={sel + " mt-1.5"}><option value="">Any</option>{["2025", "2026", "2027", "2028"].map((y) => <option key={y}>{y}</option>)}</select>
        </label>
        <label className={lbl}>Deadline
          <select name="closing" defaultValue={query.closing ?? ""} className={sel + " mt-1.5"}><option value="">Any time</option><option value="7">Within 7 days</option><option value="30">Within 30 days</option></select>
        </label>
        <label className={lbl}>Sort by
          <select name="sort" defaultValue={query.sort ?? "new"} className={sel + " mt-1.5"}>{Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        </label>
        <div className="flex gap-2">
          <button className="h-11 flex-1 rounded-lg bg-neon font-semibold text-black hover:brightness-110">Apply filters</button>
          <Link href="/opportunities" className="grid h-11 place-items-center rounded-lg border border-line px-4 text-sm font-semibold">Reset</Link>
        </div>
      </form>
      <div>
        <h2 className="sr-only">Results</h2>
        <p className="mb-4 text-sm text-ink-soft" aria-live="polite">{total} {total === 1 ? "opportunity" : "opportunities"}{pages > 1 && ` · page ${page} of ${pages}`}</p>
        {items.length ? <ul className="grid gap-6 sm:grid-cols-2">{items.map((o) => <li key={o.id}><OpportunityCard o={o} /></li>)}</ul>
          : <p className="card p-10 text-center text-ink-soft">Nothing matches those filters yet. Try widening them or <Link href="/opportunities" className="text-accent underline">reset</Link>.</p>}
        {pages > 1 && (
          <nav aria-label="Pagination" className="mt-8 flex items-center justify-between">
            {page > 1 ? <Link href={href(query, page - 1)} rel="prev" className="rounded-lg border border-line px-4 py-2 text-sm font-semibold">← Previous</Link> : <span />}
            {page < pages ? <Link href={href(query, page + 1)} rel="next" className="rounded-lg border border-line px-4 py-2 text-sm font-semibold">Next →</Link> : <span />}
          </nav>
        )}
      </div>
    </div>
  );
}
