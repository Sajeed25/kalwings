import { Serif } from "@/components/ui/serif";
import type { Metadata } from "next";
import { PageHero, Block } from "@/components/pages/shell";
import { ActionForm, Area, Field, inputCls } from "@/components/dash/action-form";
import { sendContact } from "@/app/actions/contact";
import { getSettings } from "@/lib/settings";
import { office } from "@/data/robokalam";

export const metadata: Metadata = { title: "Contact" };

export default async function Page() {
  const { supportEmail } = await getSettings();
  return (
    <>
      <PageHero eyebrow="Contact" title={<>Let&apos;s <Serif>talk</Serif>.</>} lead="Students, employers, colleges, mentors or press — tell us what you need." />
      <Block>
        <div className="max-w-xl">
          <ActionForm action={sendContact} reset submit="Send message" success="Thanks — we'll get back to you soon.">
            <Field label="Name" name="name" required minLength={2} autoComplete="name" />
            <Field label="Email" name="email" type="email" required autoComplete="email" />
            <label className="block text-sm font-semibold">I am a…
              <select name="topic" className={inputCls}><option>Student</option><option>Employer</option><option>College</option><option>Mentor</option><option>Press</option></select>
            </label>
            <Area label="Message" name="message" required minLength={10} maxLength={2000} />
            {/* Honeypot — hidden from people and assistive tech */}
            <div aria-hidden className="absolute -left-[9999px]"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
          </ActionForm>
          <p className="mt-6 text-sm text-ink-soft">Prefer email? Write to <a className="text-accent underline" href={`mailto:${supportEmail}`}>{supportEmail}</a>. Privacy requests and complaints go to the same address.</p>
          <p className="mt-4 text-sm text-ink-soft">Visit or call the Robokalam / KodeZ team: {office.lines.join(" ")} · WhatsApp {office.whatsapp.map((w, i) => <span key={w.href}>{i ? " · " : ""}<a className="text-accent underline" href={w.href} rel="noopener">{w.label}</a></span>)}.</p>
        </div>
      </Block>
    </>
  );
}
