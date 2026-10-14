"use client";
import { startTransition, useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { runSamples, submitAttempt, type RunState, type TestOutcome } from "@/app/actions/assessments";

const LABEL: Record<string, string> = { OK: "Ran", WRONG_ANSWER: "Wrong answer", TIME_LIMIT: "Time limit exceeded", COMPILE_ERROR: "Compile error", RUNTIME_ERROR: "Runtime error", MEMORY_LIMIT: "Memory limit exceeded", SERVICE_ERROR: "Service error" };

export function Results({ results, passed, total }: { results: TestOutcome[]; passed?: number; total?: number }) {
  return (
    <div className="mt-4" aria-live="polite">
      <p className="font-semibold">{passed}/{total} tests passed</p>
      <ul className="mt-2 space-y-2 text-sm">{results.map((r) => (
        <li key={r.index} className="rounded-lg border border-line p-3">
          <p><b>{r.hidden ? `Hidden test ${r.index + 1}` : `Sample ${r.index + 1}`}</b>: <span className={r.passed ? "text-accent" : "text-danger"}>{r.passed ? "Passed" : LABEL[r.outcome] ?? r.outcome}</span> <span className="text-ink-soft">· {r.timeMs} ms</span></p>
          {!r.hidden && !r.passed && (
            <dl className="mt-2 grid gap-1 font-mono text-xs">
              <div><dt className="inline text-ink-soft">input: </dt><dd className="inline whitespace-pre-wrap">{r.input}</dd></div>
              <div><dt className="inline text-ink-soft">expected: </dt><dd className="inline whitespace-pre-wrap">{r.expected}</dd></div>
              <div><dt className="inline text-ink-soft">got: </dt><dd className="inline whitespace-pre-wrap">{r.got || "(nothing)"}</dd></div>
              {r.error && <div><dt className="inline text-ink-soft">error: </dt><dd className="inline whitespace-pre-wrap text-danger">{r.error}</dd></div>}
            </dl>)}
        </li>))}</ul>
    </div>
  );
}

export function Workspace({ assessmentId, languages, labels, memoryMb, timeLimitMs }: { assessmentId: string; languages: string[]; labels: Record<string, string>; memoryMb: number; timeLimitMs: number }) {
  const [run, doRun, running] = useActionState<RunState, FormData>(runSamples, {});
  const [sub, doSubmit, submitting] = useActionState<RunState, FormData>(submitAttempt, {});
  const [code, setCode] = useState("");
  const [lang, setLang] = useState(languages[0]);
  const fd = () => { const f = new FormData(); f.set("assessmentId", assessmentId); f.set("language", lang); f.set("code", code); return f; };
  const shown = sub.results ? sub : run;
  return (
    <section className="card p-6" aria-label="Code workspace">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <label className="text-sm font-semibold">Language
          <select value={lang} onChange={(e) => setLang(e.target.value)} className="ml-2 h-10 rounded-lg border border-line bg-surface px-3 text-[15px]">{languages.map((l) => <option key={l} value={l}>{labels[l] ?? l}</option>)}</select>
        </label>
        <p className="text-xs text-ink-soft">Limits per test: {timeLimitMs} ms CPU, {memoryMb} MB, no network.</p>
      </div>
      <label className="mt-4 block text-sm font-semibold" htmlFor="code">Your solution (reads from standard input, writes to standard output)</label>
      <textarea id="code" value={code} onChange={(e) => setCode(e.target.value)} spellCheck={false} rows={16} maxLength={20000}
        onKeyDown={(e) => { if (e.key === "Tab" && !e.shiftKey) { e.preventDefault(); const t = e.currentTarget, s = t.selectionStart; setCode(code.slice(0, s) + "  " + code.slice(t.selectionEnd)); requestAnimationFrame(() => t.setSelectionRange(s + 2, s + 2)); } }}
        className="mt-1.5 w-full rounded-lg border border-line bg-black p-3 font-mono text-sm text-white" aria-describedby="tabhint" />
      <p id="tabhint" className="mt-1 text-xs text-ink-soft">Tab inserts spaces. Press Escape then Tab to move focus away.</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button type="button" variant="secondary" disabled={running || submitting || !code.trim()} onClick={() => startTransition(() => doRun(fd()))}>{running ? "Running…" : "Run samples"}</Button>
        <Button type="button" disabled={running || submitting || !code.trim()} onClick={() => startTransition(() => doSubmit(fd()))}>{submitting ? "Submitting…" : "Submit (runs all tests)"}</Button>
        {(run.error || sub.error) && <p role="alert" className="text-sm font-medium text-danger">{sub.error ?? run.error}</p>}
        {sub.saved && <p role="status" className="text-sm font-medium text-accent">Attempt saved to your history.</p>}
      </div>
      {shown.results && <Results results={shown.results} passed={shown.passed} total={shown.total} />}
    </section>
  );
}
