"use client";
export function PrintButton() {
  return <button type="button" onClick={() => window.print()} className="no-print rounded-lg bg-neon px-4 py-2 text-sm font-semibold text-black hover:brightness-110">Print or save as PDF</button>;
}
