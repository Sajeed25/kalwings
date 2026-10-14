"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ActionForm, Area, Field } from "@/components/dash/action-form";
import { addProject, saveProfile } from "@/app/actions/student";
import { PageTitle, Panel } from "@/components/dash/ui";
import type { Result } from "@/app/actions/_shared";

export function Wizard({ name, hasProfile }: { name: string; hasProfile: boolean }) {
  const [step, setStep] = useState(hasProfile ? 3 : 1);
  const router = useRouter();
  const steps = ["About you", "Skills", "First project"];
  // Steps 1–2 hold local state; the profile is saved once on step 2 so validation errors surface in one place.
  const [draft, setDraft] = useState<Record<string, string>>({ name });
  const set = (fd: FormData) => setDraft((d) => ({ ...d, ...Object.fromEntries(Array.from(fd.entries()).map(([k, v]) => [k, String(v)])) }));

  const save = async (_: Result, fd: FormData): Promise<Result> => {
    const all = new FormData();
    Object.entries({ ...draft, ...Object.fromEntries(Array.from(fd.entries()).map(([k, v]) => [k, String(v)])) }).forEach(([k, v]) => all.set(k, v));
    const r = await saveProfile({}, all);
    if (r.ok) setStep(3);
    return r;
  };
  const project = async (p: Result, fd: FormData): Promise<Result> => {
    const r = await addProject(p, fd);
    if (r.ok) router.push("/dashboard");
    return r;
  };

  return (
    <>
      <PageTitle title="Let's build your Talent Card" sub="Three quick steps. You can edit everything later." />
      <ol className="mb-6 flex gap-2 text-sm font-semibold">{steps.map((s, i) => <li key={s} className={`rounded-full px-3 py-1 ${i + 1 === step ? "bg-primary text-white" : i + 1 < step ? "bg-accent/15 text-accent" : "bg-muted text-ink-soft"}`}>{i + 1}. {s}</li>)}</ol>
      <Panel>
        {step === 1 && (
          <form action={(fd) => { set(fd); setStep(2); }} className="space-y-4">
            <Field label="Full name" name="name" defaultValue={draft.name} required minLength={2} />
            <Field label="Headline" name="headline" defaultValue={draft.headline} required minLength={3} maxLength={120} placeholder="e.g. ECE final-year · embedded & Python" />
            <div className="grid gap-4 sm:grid-cols-2"><Field label="Graduation year" name="graduationYear" type="number" min={2020} max={2032} defaultValue={draft.graduationYear} required /><Field label="City" name="city" defaultValue={draft.city} /></div>
            <button className="h-11 rounded-lg bg-primary px-6 font-semibold text-white">Next</button>
          </form>
        )}
        {step === 2 && (
          <ActionForm action={save} submit="Save & continue" success="Saved">
            <Field label="Skills" name="skills" defaultValue={draft.skills} hint="Comma-separated. These show as self-declared until backed by evidence." placeholder="Python, Embedded C, Circuit design" />
            <Area label="Short bio" name="bio" defaultValue={draft.bio} maxLength={600} />
            <Field label="GitHub (optional)" name="githubUrl" type="url" defaultValue={draft.githubUrl} placeholder="https://github.com/…" />
            <Field label="Looking for" name="lookingFor" defaultValue={draft.lookingFor} placeholder="Internship, full-time, challenge…" />
          </ActionForm>
        )}
        {step === 3 && (
          <>
            <p className="mb-4 text-ink-soft">Projects are the heart of your proof. Add one now — you can add more later.</p>
            <ActionForm action={project} submit="Add project & finish">
              <Field label="Project title" name="title" required minLength={3} />
              <Area label="What did you build, and what was your part?" name="summary" required minLength={10} />
              <div className="grid gap-4 sm:grid-cols-2"><Field label="Code link" name="githubUrl" type="url" /><Field label="Demo link" name="demoUrl" type="url" /></div>
            </ActionForm>
            <button onClick={() => router.push("/dashboard")} className="mt-4 text-sm font-semibold underline">Skip for now</button>
          </>
        )}
      </Panel>
    </>
  );
}
