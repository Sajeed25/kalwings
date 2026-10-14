"use client";
import { useEffect, useState } from "react";

/** Theme choice lives here (Settings), not in the page header. Dark is the default. Stored in this browser only. */
export function Appearance() {
  const [theme, setTheme] = useState<"dark" | "light" | null>(null); // null until read, so no option looks selected before we know
  useEffect(() => setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark"), []);
  const pick = (t: "dark" | "light") => {
    setTheme(t);
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem("kw-theme", t); } catch { /* private mode: applies for this visit only */ }
  };
  return (
    <fieldset>
      <legend className="sr-only">Theme</legend>
      <div className="flex gap-3">
        {(["dark", "light"] as const).map((t) => (
          <label key={t} className={`flex flex-1 cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm font-medium ${theme === t ? "border-primary bg-primary/10" : "border-line"}`}>
            <input type="radio" name="theme" value={t} checked={theme === t} onChange={() => pick(t)} className="h-4 w-4 accent-primary" />
            <span className="capitalize">{t}</span>
          </label>
        ))}
      </div>
      <p className="mt-3 text-xs text-ink-soft">Saved in this browser. Dark is the default.</p>
    </fieldset>
  );
}
