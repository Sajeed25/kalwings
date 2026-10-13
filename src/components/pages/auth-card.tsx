"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/wing";
import { requestOtp, submitOtp, type AuthState } from "@/app/actions/auth";

const f = "mt-1.5 h-12 w-full rounded-xl border border-line bg-surface px-3.5 text-[15px]";
const errs: Record<string, string> = { "google-not-configured": "Google sign-in isn't configured yet.", "google-state": "Google sign-in expired. Try again.", "google-token": "Google sign-in failed.", "google-email": "Your Google email isn't verified.", suspended: "This account has been suspended. Please contact support." };

export function AuthCard({ mode, initialRole, errorCode, googleEnabled = false }: { mode: "join" | "login"; initialRole: string; errorCode?: string; googleEnabled?: boolean }) {
  const join = mode === "join";
  const [role, setRole] = useState(["STUDENT", "MENTOR", "EMPLOYER", "COLLEGE_ADMIN"].includes(initialRole) ? initialRole : "STUDENT");
  const [s1, a1, p1] = useActionState(requestOtp, { step: "identify", mode } as AuthState);
  const [s2, a2, p2] = useActionState(submitOtp, { step: "code", mode } as AuthState);
  const code = s1.step === "code";
  const error = (code ? s2.error : s1.error) ?? (errorCode ? errs[errorCode] : undefined);

  return (
    <div className="container flex min-h-[70vh] items-center justify-center py-16">
      <div className="card w-full max-w-md p-8">
        <Logo />
        <h1 className="mt-6 text-3xl font-extrabold">{join ? "Join Kalwings" : "Welcome back"}</h1>
        <p className="mt-1 text-ink-soft">{join ? "Free for students. Always." : "Log in with a one-time code."}</p>
        {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">{error}</p>}

        {!code ? (
          <form action={a1} className="mt-6 space-y-4">
            {join && (
              <label className="block text-sm font-semibold">I am a…
                <select className={f} name="role" value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="STUDENT">Student</option><option value="MENTOR">Mentor</option><option value="EMPLOYER">Employer</option><option value="COLLEGE_ADMIN">College admin</option>
                </select>
              </label>
            )}
            <label className="block text-sm font-semibold">Email or mobile number<input className={f} name="identifier" autoComplete="username" required /></label>
            <Button size="lg" className="w-full" disabled={p1}>{p1 ? "Sending…" : "Send one-time code"}</Button>
            {googleEnabled && <Button asChild size="lg" variant="secondary" className="w-full"><a href={`/api/auth/google?role=${role}`}>Continue with Google</a></Button>}
          </form>
        ) : (
          <form action={a2} className="mt-6 space-y-4">
            <input type="hidden" name="identifier" value={s1.identifier} />
            <p className="text-sm text-ink-soft">We sent a 6-digit code to <b className="text-ink">{s1.identifier}</b>.</p>
            {s1.devCode && <p className="rounded-xl border border-dashed border-saffron/60 bg-saffron-50 p-3 text-sm text-saffron-700">Dev mode — no email/SMS provider is connected. Your code is <b>{s1.devCode}</b>.</p>}
            {join && <label className="block text-sm font-semibold">Your name<input className={f} name="name" defaultValue={s2.name} autoComplete="name" required minLength={2} /></label>}
            {join && <input type="hidden" name="role" value={s1.role} />}
            <label className="block text-sm font-semibold">6-digit code<input className={f} name="code" inputMode="numeric" pattern="\d{6}" maxLength={6} autoComplete="one-time-code" required /></label>
            <Button size="lg" className="w-full" disabled={p2}>{p2 ? "Checking…" : join ? "Create my account" : "Log in"}</Button>
          </form>
        )}
        <p className="mt-6 text-center text-sm text-ink-soft">{join ? <>Already a member? <Link className="font-semibold text-ink underline" href="/login">Log in</Link></> : <>New here? <Link className="font-semibold text-ink underline" href="/join">Join Kalwings</Link></>}</p>
      </div>
    </div>
  );
}
