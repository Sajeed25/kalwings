"use client";
import { startTransition, useActionState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { NoteResult } from "@/app/actions/console";

/** One form shell for every admin-console action: submits through a server action and shows its error or confirmation. */
export function ConsoleForm({ action, label, submit, children, className = "grid gap-4 sm:grid-cols-2", resetOnSuccess = false }: {
  action: (s: NoteResult, fd: FormData) => Promise<NoteResult>; label: string; submit: string; children: ReactNode; className?: string; resetOnSuccess?: boolean;
}) {
  const [state, run, pending] = useActionState(action, {} as NoteResult);
  return (
    <form aria-label={label} className={className}
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const fd = new FormData(form);
        startTransition(async () => { await run(fd); if (resetOnSuccess) form.reset(); });
      }}>
      {children}
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <Button disabled={pending}>{pending ? "Saving…" : submit}</Button>
        <div role="status" aria-live="polite">
          {state.error && <p role="alert" className="text-sm font-medium text-danger">{state.error}</p>}
          {state.ok && <p className="text-sm font-medium text-accent">{state.note ?? "Saved."}</p>}
        </div>
      </div>
    </form>
  );
}

export const lbl = "block text-sm font-semibold";
export const hint = "mt-1 block text-xs font-normal text-ink-soft";
