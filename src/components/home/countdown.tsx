"use client";
import { useEffect, useState } from "react";

export function Countdown({ iso }: { iso: string }) {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const t = () => setLeft(Math.max(0, new Date(iso).getTime() - Date.now()));
    t();
    const id = setInterval(t, 1000);
    return () => clearInterval(id);
  }, [iso]);
  const parts = left == null ? [["Days", 0], ["Hours", 0], ["Mins", 0], ["Secs", 0]] as const : [
    ["Days", Math.floor(left / 864e5)], ["Hours", Math.floor(left / 36e5) % 24],
    ["Mins", Math.floor(left / 6e4) % 60], ["Secs", Math.floor(left / 1e3) % 60],
  ] as const;
  return (
    <div className="mt-4 grid grid-cols-4 gap-3" role="timer" aria-live="off">
      {parts.map(([l, v]) => (
        <div key={l} className="rounded-lg bg-white/5 py-5 text-center">
          <div className="font-display text-4xl font-extrabold tabular-nums md:text-5xl">{String(v).padStart(2, "0")}</div>
          <div className="mt-1 text-xs text-white/60">{l}</div>
        </div>
      ))}
    </div>
  );
}
