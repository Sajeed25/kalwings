"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/brand";
import { loginWithPassword, requestOtp, submitOtp, type AuthState } from "@/app/actions/auth";

const f = "mt-1.5 h-12 w-full border border-line bg-bg px-4 text-[15px]";
const errs: Record<string, string> = { "google-not-configured": "Google sign-in isn't configured yet.", "google-state": "Google sign-in expired. Try again.", "google-token": "Google sign-in failed.", "google-email": "Your Google email isn't verified.", suspended: "This account has been suspended. Please contact support." };

export function AuthCard({ mode, initialRole, errorCode, googleEnabled = false }: { mode: "join" | "login"; initialRole: string; errorCode?: string; googleEnabled?: boolean }) {
  const join = mode === "join";
  const [role, setRole] = useState(["STUDENT", "MENTOR", "EMPLOYER", "COLLEGE_ADMIN"].includes(initialRole) ? initialRole : "STUDENT");
  const [s1, a1, p1] = useActionState(requestOtp, { step: "identify", mode } as AuthState);
  const [s2, a2, p2] = useActionState(submitOtp, { step: "code", mode } as AuthState);
  const [s3, a3, p3] = useActionState(loginWithPassword, { step: "identify", mode } as AuthState);
  const [usePassword, setUsePassword] = useState(false);
  const code = s1.step === "code";
  const passwordMode = !join && usePassword && !code;
  const error = (passwordMode ? s3.error : code ? s2.error : s1.error) ?? (errorCode ? errs[errorCode] : undefined);

  return (
    <div className="container grid min-h-[78vh] items-center gap-14 py-12 lg:grid-cols-[1.1fr_minmax(0,460px)]">
      <div className="hidden lg:block">
        <h1 className="max-w-xl text-6xl font-bold leading-[1.02]">Hire on <span className="serif-accent text-[1.12em]">proof</span>, not résumés.</h1>
        <p className="mt-6 max-w-lg text-lg text-ink-soft">Students show real work. Employers see it before they hire.</p>
        <ul className="mt-10 flex max-w-xl flex-wrap gap-3 text-[15px] font-semibold">
          <li className="sticker-lilac -rotate-2 rounded-full px-5 py-2.5">Pay shown upfront</li>
          <li className="sticker-sun rotate-1 rounded-full px-5 py-2.5">Verified employers</li>
          <li className="sticker-mint -rotate-1 rounded-full px-5 py-2.5">Work scored by people</li>
          <li className="sticker-primary rotate-2 rounded-full px-5 py-2.5">No auto-rejections</li>
        </ul>
      </div>
      <div className="card-lg mx-auto w-full max-w-md rounded-card-lg border border-line bg-surface p-8 md:p-10">
        <div className="lg:hidden"><Logo /></div>
        <h2 className="mt-6 text-3xl font-bold lg:mt-0">{join ? "Create your " : "Welcome "}<span className="serif-accent text-[1.12em]">{join ? "account" : "back"}</span></h2>
        <p className="mt-2 text-ink-soft">{join ? "Free for students." : (passwordMode ? "Use your password." : "We will email you a one-time code.")}</p>
        {error && <p role="alert" className="mt-4 rounded-lg bg-danger/15 p-3 text-sm text-danger">{error}</p>}

        {passwordMode ? (
          <form action={a3} className="mt-6 space-y-4">
            <label className="block text-sm font-semibold">Email<input className={f} name="identifier" type="email" placeholder="you@example.com" autoComplete="username" required defaultValue={s3.identifier} /></label>
            <label className="block text-sm font-semibold">Password<input className={f} name="password" type="password" autoComplete="current-password" required maxLength={128} /></label>
            <Button size="lg" className="w-full" disabled={p3}>{p3 ? "Checking…" : "Log in"}</Button>
            <p className="text-sm text-ink-soft">Don&apos;t have a password, or forgot it? <button type="button" className="font-semibold text-ink underline" onClick={() => setUsePassword(false)}>Log in with an email code</button>, then set a new one under Account &amp; data.</p>
          </form>
        ) : !code ? (
          <form action={a1} className="mt-6 space-y-4">
            {join && (
              <label className="block text-sm font-semibold">I am a…
                <select className={f} name="role" value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="STUDENT">Student</option><option value="MENTOR">Mentor</option><option value="EMPLOYER">Employer</option><option value="COLLEGE_ADMIN">College admin</option>
                </select>
              </label>
            )}
            <label className="block text-sm font-semibold">Email<input className={f} name="identifier" type="email" placeholder="you@example.com" autoComplete="username" required /></label>
            <Button size="lg" className="w-full" disabled={p1}>{p1 ? "Sending…" : "Send one-time code"}</Button>
            {googleEnabled && <Button asChild size="lg" variant="secondary" className="w-full"><a href={`/api/auth/google?role=${role}`}>Continue with Google</a></Button>}
            {!join && <button type="button" className="w-full text-center text-sm font-semibold text-ink underline" onClick={() => setUsePassword(true)}>Use my password instead</button>}
          </form>
        ) : (
          <form action={a2} className="mt-6 space-y-4">
            <input type="hidden" name="identifier" value={s1.identifier} />
            <p className="text-sm text-ink-soft">We emailed a 6-digit code to <b className="text-ink">{s1.identifier}</b>.</p>
            {s1.devCode && <p className="rounded-xl border border-dashed border-spot/60 bg-spot/10 p-3 text-sm text-spot">Dev mode — no email provider is connected. Your code is <b>{s1.devCode}</b>.</p>}
            {join && <label className="block text-sm font-semibold">Your name<input className={f} name="name" defaultValue={s2.name} autoComplete="name" required minLength={2} /></label>}
            {join && <input type="hidden" name="role" value={s1.role} />}
            <label className="block text-sm font-semibold">6-digit code<input className={f} name="code" inputMode="numeric" pattern="\d{6}" maxLength={6} autoComplete="one-time-code" required /></label>
            <Button size="lg" className="w-full" disabled={p2}>{p2 ? "Checking…" : join ? "Create my account" : "Log in"}</Button>
          </form>
        )}
        <p className="mt-6 text-center text-sm text-ink-soft">{join ? <>Already a member? <Link className="font-semibold text-ink underline" href="/login">Log in</Link></> : <>New here? <Link className="font-semibold text-ink underline" href="/join">Create an account</Link></>}</p>
      </div>
    </div>
  );
}
