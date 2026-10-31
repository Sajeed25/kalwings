"use client";
import { useState, useTransition } from "react";
import { submitPractice, type PracticeResult } from "@/app/actions/practice";
import type { forTaking } from "@/lib/practice-bank";

/** Takes one practice test. Answers stay on the server until the student submits. */
export function PracticeRunner({ test }: { test: ReturnType<typeof forTaking> }) {
  const [chosen, setChosen] = useState<(number | null)[]>(() => test.questions.map(() => null));
  const [res, setRes] = useState<PracticeResult>();
  const [pending, start] = useTransition();
  const done = res?.review;
  return (
    <div>
      <ol className="space-y-6">
        {test.questions.map((q, i) => {
          const r = done?.[i];
          return (
            <li key={i}>
              <fieldset disabled={!!done}>
                <legend className="font-semibold">{i + 1}. {q.q}</legend>
                <div className="mt-2 grid gap-2">
                  {q.options.map((o, j) => {
                    const tone = r ? (j === r.correct ? "border-accent" : r.chosen === j ? "border-danger" : "border-line") : "border-line";
                    return (
                      <label key={j} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-sm ${tone}`}>
                        <input type="radio" name={`q${i}`} checked={(r ? r.chosen : chosen[i]) === j} onChange={() => setChosen((c) => c.map((v, k) => (k === i ? j : v)))} />
                        <span>{o}{r && j === r.correct ? " — correct answer" : r && r.chosen === j ? " — your answer" : ""}</span>
                      </label>
                    );
                  })}
                </div>
                {r && <p className="mt-2 text-sm text-ink-soft">{r.why}</p>}
              </fieldset>
            </li>
          );
        })}
      </ol>
      {!done && (
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button type="button" disabled={pending} className="inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-bold text-on-primary" onClick={() => start(async () => setRes(await submitPractice({ slug: test.slug, chosen })))}>{pending ? "Checking…" : "Submit answers"}</button>
          <p className="text-xs text-ink-soft">Unanswered questions count as skipped. Only you see your score.</p>
        </div>
      )}
      <div role="status" aria-live="polite" className="mt-4">
        {res?.error && <p role="alert" className="text-sm font-medium text-danger">{res.error}</p>}
        {done && <p className="text-lg font-bold">You scored {res!.score} out of {res!.total}. <span className="text-sm font-normal text-ink-soft">Practice only: not a certificate, and employers never see it.</span></p>}
      </div>
    </div>
  );
}
