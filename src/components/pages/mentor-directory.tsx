"use client";
import { useMemo, useState } from "react";
import { MentorCard } from "@/components/home/mentor-wall";
import type { Mentor } from "@/data/sample";

const sel = "h-11 rounded-xl border border-line bg-surface px-3 text-[15px]";
const uniq = (a: string[]) => Array.from(new Set(a)).sort();

export function MentorDirectory({ items: mentors }: { items: Mentor[] }) {
  const [domain, setDomain] = useState("");
  const [country, setCountry] = useState("");
  const [avail, setAvail] = useState(false);
  const list = useMemo(() => mentors.filter((m) => (!domain || m.domain === domain) && (!country || m.country === country) && (!avail || m.available)), [mentors, domain, country, avail]);
  return (
    <div>
      <form aria-label="Filter mentors" className="flex flex-wrap items-center gap-3" onSubmit={(e) => e.preventDefault()}>
        <label className="sr-only" htmlFor="d">Domain</label>
        <select id="d" className={sel} value={domain} onChange={(e) => setDomain(e.target.value)}><option value="">All domains</option>{uniq(mentors.map((m) => m.domain)).map((d) => <option key={d}>{d}</option>)}</select>
        <label className="sr-only" htmlFor="c">Country</label>
        <select id="c" className={sel} value={country} onChange={(e) => setCountry(e.target.value)}><option value="">All countries</option>{uniq(mentors.map((m) => m.country)).map((d) => <option key={d}>{d}</option>)}</select>
        <label className="flex items-center gap-2 text-[15px]"><input type="checkbox" checked={avail} onChange={(e) => setAvail(e.target.checked)} className="h-4 w-4 accent-neon" />Available now</label>
      </form>
      <h2 className="sr-only">Mentors</h2>
      <p className="mt-4 text-sm text-ink-soft" aria-live="polite">{list.length} verified mentors</p>
      <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{list.map((m) => <li key={m.slug}><MentorCard m={m} /></li>)}</ul>
    </div>
  );
}
