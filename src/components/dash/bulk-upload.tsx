"use client";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { inputCls } from "@/components/dash/action-form";
import type { BulkReport } from "@/lib/bulk";

type Props = { kind: "students" | "companies" | "mentors"; title: string; help: string; columns: string[] };

/** Choose a file, preview what would happen row by row, then import. Nothing is saved until "Import". */
export function BulkUpload({ kind, title, help, columns }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [report, setReport] = useState<BulkReport>();
  const [emails, setEmails] = useState(false);

  async function send(mode: "preview" | "import") {
    const file = fileRef.current?.files?.[0];
    if (!file) { setError("Choose a file first."); return; }
    setBusy(true); setError(undefined);
    try {
      const fd = new FormData(); fd.set("file", file); fd.set("kind", kind); fd.set("mode", mode); if (emails) fd.set("sendEmails", "1");
      const res = await fetch("/api/admin/bulk", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      setReport(json as BulkReport);
    } catch (e) { setError(e instanceof Error ? e.message : "Upload failed"); setReport(undefined); }
    finally { setBusy(false); }
  }

  return (
    <section className="card p-6 md:p-7" aria-label={`Bulk upload ${title}`}>
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="mt-1 text-sm text-ink-soft">{help}</p>
      <p className="mt-2 text-xs text-ink-soft">Columns: <code>{columns.join(", ")}</code></p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button asChild variant="secondary" size="sm"><a href={`/api/admin/bulk/template?kind=${kind}`} download>Download template</a></Button>
        <input ref={fileRef} type="file" accept=".xlsx,.csv" aria-label={`${title} file`} className={inputCls + " max-w-xs"} onChange={() => { setReport(undefined); setError(undefined); }} />
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={emails} onChange={(e) => setEmails(e.target.checked)} /> Email each new person how to sign in (up to 200 per upload)</label>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button type="button" variant="secondary" disabled={busy} onClick={() => send("preview")}>{busy ? "Working…" : "Preview"}</Button>
        <Button type="button" disabled={busy || !report || report.committed || report.counts.ok === 0} onClick={() => send("import")}>Import</Button>
      </div>
      <div role="status" aria-live="polite" className="mt-3">
        {error && <p role="alert" className="text-sm font-medium text-danger">{error}</p>}
        {report && (
          <div>
            <p className="text-sm font-semibold" data-testid="bulk-summary">{report.committed ? "Imported" : "Preview"}: {report.counts.ok} {report.committed ? "added" : "ready to add"}, {report.counts.skipped} skipped, {report.counts.error} with errors.{report.committed && emails ? ` ${report.emailsSent} sign-in email${report.emailsSent === 1 ? "" : "s"} sent.` : ""}</p>
            {!report.committed && report.counts.ok > 0 && <p className="text-xs text-ink-soft">Nothing is saved yet. Press Import to add the rows marked ready.</p>}
            <div className="mt-3 max-h-80 overflow-auto rounded-xl border border-line">
              <table className="w-full text-left text-sm"><thead className="sticky top-0 bg-surface"><tr><th className="p-2">Row</th><th className="p-2">Who</th><th className="p-2">Result</th></tr></thead>
                <tbody>{report.rows.map((r) => <tr key={r.n} className="border-t border-line"><td className="p-2">{r.n}</td><td className="p-2">{r.label}</td><td className={`p-2 ${r.status === "error" ? "text-danger" : r.status === "skipped" ? "text-ink-soft" : ""}`}>{r.status === "ok" ? "✓ " : r.status === "skipped" ? "– " : "✕ "}{r.message}</td></tr>)}</tbody></table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
