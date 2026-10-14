"use client";
import { startTransition, useActionState, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { inputCls } from "@/components/dash/action-form";
import { createUser, type CreateUserResult } from "@/app/actions/admin";

const ROLES: [string, string][] = [["STUDENT", "Student"], ["MENTOR", "Mentor"], ["EMPLOYER", "HR / recruiter at a company"], ["COLLEGE_ADMIN", "College admin"], ["PLATFORM_ADMIN", "Platform admin"]];

/** Platform admin only. Adds an account directly; the person signs in with an emailed code. */
export function AddUserForm() {
  const [state, run, pending] = useActionState(createUser, {} as CreateUserResult);
  const [role, setRole] = useState("EMPLOYER");
  const form = useRef<HTMLFormElement>(null);
  const lbl = "block text-sm font-semibold";
  return (
    <form ref={form} aria-label="Add a user" className="grid gap-4 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (role === "PLATFORM_ADMIN" && !window.confirm("Platform admins can see and change everything. Add this person as a platform admin?")) return;
        const fd = new FormData(e.currentTarget);
        startTransition(async () => { await run(fd); });
      }}>
      <label className={lbl}>Name<input name="name" required minLength={2} maxLength={80} autoComplete="off" className={inputCls} /></label>
      <label className={lbl}>Email<input name="email" type="email" required autoComplete="off" className={inputCls} /></label>
      <label className={lbl + " sm:col-span-2"}>Role<select name="role" value={role} onChange={(e) => setRole(e.target.value)} className={inputCls + " h-11"}>{ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
      {role === "EMPLOYER" && <>
        <label className={lbl}>Company<input name="companyName" required minLength={2} maxLength={120} className={inputCls} /><span className="mt-1 block text-xs font-normal text-ink-soft">If the company already exists they join it. A new company is created as verified.</span></label>
        <label className={lbl}>Company website (optional)<input name="companyWebsite" type="url" placeholder="https://" maxLength={400} className={inputCls} /></label>
      </>}
      {role === "COLLEGE_ADMIN" && <>
        <label className={lbl}>College<input name="collegeName" required minLength={2} maxLength={160} className={inputCls} /></label>
        <label className={lbl}>City (optional)<input name="city" maxLength={80} className={inputCls} /></label>
      </>}
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <Button disabled={pending}>{pending ? "Adding…" : "Add user"}</Button>
        <p className="text-xs text-ink-soft">They sign in with a one-time code sent to this email. No password is set. Every addition is logged.</p>
      </div>
      <div role="status" aria-live="polite" className="sm:col-span-2">
        {state.error && <p role="alert" className="text-sm font-medium text-danger">{state.error}</p>}
        {state.ok && state.note && <p className="text-sm font-medium text-accent">{state.note}</p>}
      </div>
    </form>
  );
}
