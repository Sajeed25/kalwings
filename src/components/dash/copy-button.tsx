"use client";
import { useState } from "react";

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold hover:bg-muted" onClick={async () => {
      try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1800); } catch { window.prompt("Copy this text", text); }
    }}>{done ? "Copied ✓" : label}<span className="sr-only" aria-live="polite">{done ? "Copied to clipboard" : ""}</span></button>
  );
}
