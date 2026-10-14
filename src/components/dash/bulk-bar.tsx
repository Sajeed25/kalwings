"use client";
import { startTransition, useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { inputCls } from "@/components/dash/action-form";
import { bulkUpdate, type BulkResult } from "@/app/actions/employer";

const ACTIONS: [string, string][] = [["", "Choose an action…"], ["UNDER_REVIEW", "Move to Under review"], ["SHORTLISTED", "Move to Shortlisted"], ["REJECTED", "Reject"], ["ADD_TAG", "Add a tag"], ["REMOVE_TAG", "Remove a tag"]];

/** Acts on the checkboxes next to each candidate (they are tied to this form with form="bulk-form"). */
export function BulkBar({ stageNames }: { stageNames: Record<string, string> }) {
  const [state, run, pending] = useActionState(bulkUpdate, {} as BulkResult);
  const [action, setAction] = useState("");
  const needsTag = action === "ADD_TAG" || action === "REMOVE_TAG";
  return (
    <form id="bulk-form" aria-label="Bulk actions" className="card mb-6 flex flex-wrap items-end gap-3 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget, fd = new FormData(form), n = fd.getAll("ids").length;
        if (!n) { return startTransition(() => run(fd)); }
        if (action === "REJECTED" && !window.confirm(`Reject ${n} candidate${n === 1 ? "" : "s"}? Each will be notified.`)) return;
        startTransition(() => run(fd));
      }}>
      <label className="text-sm font-semibold">Selected candidates
        <select name="action" value={action} onChange={(e) => setAction(e.target.value)} className={inputCls + " h-11 min-w-56"}>
          {ACTIONS.map(([v, l]) => <option key={v} value={v}>{v && stageNames[v] ? `Move to ${stageNames[v]}` : l}</option>)}
        </select>
      </label>
      {needsTag && <label className="text-sm font-semibold">Tag<input name="tag" maxLength={30} required className={inputCls + " h-11"} placeholder="strong portfolio" /></label>}
      <Button disabled={pending || !action}>{pending ? "Working…" : "Apply"}</Button>
      <p role="status" aria-live="polite" className="basis-full text-sm">
        {state.error ? <span role="alert" className="font-medium text-danger">{state.error}</span> : state.note ? <span className="font-medium text-accent">{state.note}</span> : <span className="text-ink-soft">Tick candidates below, then choose an action. Tags are private notes for your team; don&apos;t record anything sensitive about a person. Nothing here runs automatically.</span>}
      </p>
    </form>
  );
}
