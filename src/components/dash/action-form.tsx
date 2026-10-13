"use client";
import { startTransition, useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import type { Result } from "@/app/actions/_shared";

export const inputCls = "mt-1.5 w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[15px] placeholder:text-ink-soft";

/** Wraps a server action with pending/error/success UI. */
export function ActionForm({ action, children, submit = "Save", success = "Saved", reset, className }: {
  action: (prev: Result, fd: FormData) => Promise<Result>; children: React.ReactNode; submit?: string; success?: string; reset?: boolean; className?: string;
}) {
  const [state, run, pending] = useActionState(action, {} as Result);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.ok && reset) ref.current?.reset(); }, [state, reset]);
  return (
    // We submit manually instead of `action={run}`: React 19 auto-resets uncontrolled forms after an action,
    // which snapped selects/checkboxes back to stale defaults and lost the user's input on errors.
    <form ref={ref} onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); startTransition(() => run(fd)); }} className={className ?? "space-y-4"}>
      {children}
      <div className="flex items-center gap-3">
        <Button disabled={pending}>{pending ? "Saving…" : submit}</Button>
        {state.error && <p role="alert" className="text-sm font-medium text-red-700 dark:text-red-300">{state.error}</p>}
        {state.ok && <p role="status" className="text-sm font-medium text-teal-700 dark:text-teal">{success}</p>}
      </div>
    </form>
  );
}

export function Field({ label, name, hint, ...rest }: { label: string; name: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block text-sm font-semibold">{label}
      <input name={name} className={inputCls} {...rest} />
      {hint && <span className="mt-1 block text-xs font-normal text-ink-soft">{hint}</span>}
    </label>
  );
}

export function Area({ label, name, hint, ...rest }: { label: string; name: string; hint?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="block text-sm font-semibold">{label}
      <textarea name={name} rows={4} className={inputCls} {...rest} />
      {hint && <span className="mt-1 block text-xs font-normal text-ink-soft">{hint}</span>}
    </label>
  );
}

/** A form that just calls a bound server action (buttons like Apply / Accept). */
export function ActionButton({ action, children, variant = "secondary", size = "sm", confirm }: { action: () => Promise<void>; children: React.ReactNode; variant?: "primary" | "secondary" | "ghost" | "dark"; size?: "sm" | "md"; confirm?: string }) {
  return (
    <form action={action} onSubmit={(e) => { if (confirm && !window.confirm(confirm)) e.preventDefault(); }}>
      <Button variant={variant} size={size}>{children}</Button>
    </form>
  );
}
