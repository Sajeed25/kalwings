"use client";
import { useState } from "react";
import { checkJobDescription, type JdFlag } from "@/lib/jdcheck";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const label = { block: "Not allowed", warn: "Fix this", tip: "Suggestion" } as const;
const tone = { block: "spot", warn: "spot", tip: "neutral" } as const;

/** Runs entirely in the browser: the draft text is not sent anywhere. */
export function JdChecker() {
  const [text, setText] = useState("");
  const [flags, setFlags] = useState<JdFlag[] | null>(null);
  return (
    <div>
      <label className="block text-sm font-semibold" htmlFor="jd">Paste your job description</label>
      <textarea id="jd" value={text} onChange={(e) => setText(e.target.value)} rows={12} className="mt-1.5 w-full rounded-xl border border-line bg-surface p-3 text-[15px]" />
      <div className="mt-3"><Button type="button" disabled={text.trim().length < 10} onClick={() => setFlags(checkJobDescription(text))}>Check description</Button></div>
      {flags && <ul className="mt-4 space-y-2 text-sm" aria-live="polite">{flags.map((f, i) => <li key={i} className="flex gap-2"><Badge tone={tone[f.level]} className="h-fit shrink-0">{label[f.level]}</Badge><span>{f.text}</span></li>)}</ul>}
    </div>
  );
}
