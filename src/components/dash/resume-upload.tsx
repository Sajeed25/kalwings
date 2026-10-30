"use client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { sendInChunks } from "@/lib/chunk-client";
import { MAX_RESUME_BYTES, RESUME_FORMATS } from "@/lib/file-limits";

/** Pick a resume (PDF, DOC, DOCX or RTF, up to 2 MB), send it in small pieces, then refresh. Optionally return to a page, such as the listing being applied to. */
export function ResumeUpload({ hasResume, backTo }: { hasResume: boolean; backTo?: string }) {
  const router = useRouter(); const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false), [pct, setPct] = useState(0), [error, setError] = useState<string>();
  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; e.target.value = ""; if (!file) return;
    setError(undefined);
    if (!/\.(pdf|docx?|rtf)$/i.test(file.name)) { setError(`Choose a ${RESUME_FORMATS} file.`); return; }
    if (file.size > MAX_RESUME_BYTES) { setError(`That file is ${(file.size / 1e6).toFixed(1)} MB. The limit is ${MAX_RESUME_BYTES / 1e6} MB. Export a smaller PDF.`); return; }
    setBusy(true); setPct(0);
    try {
      const { token, count } = await sendInChunks(file, setPct);
      const r = await fetch("/api/resume", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, count, name: file.name }) });
      const j = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) throw new Error(j.error ?? "Upload failed");
      if (backTo) router.push(backTo); else router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Upload failed"); } finally { setBusy(false); }
  }
  return (
    <div>
      <input ref={input} type="file" accept=".pdf,.doc,.docx,.rtf,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/rtf" className="sr-only" aria-label="Choose resume file" onChange={onPick} />
      <Button type="button" variant={hasResume ? "secondary" : "primary"} disabled={busy} onClick={() => input.current?.click()}>{busy ? `Uploading ${Math.round(pct * 100)}%…` : hasResume ? "Replace resume" : "Upload resume"}</Button>
      <p className="mt-2 text-xs text-ink-soft">{RESUME_FORMATS}, up to {MAX_RESUME_BYTES / 1e6} MB. Files with macros or embedded objects are refused.</p>
      <div role="status" aria-live="polite">{error && <p role="alert" className="mt-2 text-sm font-medium text-danger">{error}</p>}</div>
    </div>
  );
}
