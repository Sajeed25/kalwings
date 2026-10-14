import { requirePageRole } from "@/lib/session";
import { ActionForm, Field } from "@/components/dash/action-form";
import { PageTitle, Panel } from "@/components/dash/ui";
import { Button } from "@/components/ui/button";
import { Appearance } from "@/components/dash/appearance";
import { deleteMyAccount, removePassword, setPassword } from "@/app/actions/account";
import { sessionAgeSeconds } from "@/lib/session";
import { PASSWORD_MIN } from "@/lib/password";

export default async function Page() {
  const u = await requirePageRole();
  const fresh = (await sessionAgeSeconds()) <= 600;
  const hasPw = !!u.passwordHash;
  return (
    <>
      <PageTitle title="Settings" sub="Appearance, sign-in, and your data: download it any time, or delete it." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Appearance"><Appearance /></Panel>
        <Panel title="Password login (optional)">
          <p className="text-sm text-ink-soft">{hasPw ? "Password login is on. You can still always log in with an email code." : "Email codes always work. Add a password if you'd like to log in with your email and password instead."}</p>
          <ActionForm action={setPassword} reset submit={hasPw ? "Change password" : "Turn on password login"} success={hasPw ? "Password changed" : "Password login is on"} className="mt-4 space-y-3">
            {hasPw && <Field label={fresh ? "Current password (leave blank if you just logged in with an email code)" : "Current password"} name="current" type="password" autoComplete="current-password" />}
            <Field label="New password" name="password" type="password" autoComplete="new-password" required minLength={PASSWORD_MIN} maxLength={128} hint={`At least ${PASSWORD_MIN} characters. A phrase of a few words works well.`} />
            <Field label="Repeat new password" name="confirmPassword" type="password" autoComplete="new-password" required />
          </ActionForm>
          {hasPw && (
            <details className="mt-5 text-sm"><summary className="cursor-pointer font-semibold">Turn off password login</summary>
              <ActionForm action={removePassword} reset submit="Remove password" success="Password removed" className="mt-3 space-y-3"><Field label="Current password" name="current" type="password" autoComplete="current-password" required /></ActionForm>
            </details>)}
        </Panel>
        <Panel title="Download my data">
          <p className="text-sm text-ink-soft">Get a JSON file with your profile, projects, applications, sessions, messages you sent and notifications. It never includes other people&apos;s contact details.</p>
          <Button asChild variant="secondary" className="mt-4"><a href="/api/account/export" download>Download my data</a></Button>
        </Panel>
        <Panel title="Delete my account">
          {u.role === "PLATFORM_ADMIN" ? <p className="text-sm text-ink-soft">Platform admin accounts can&apos;t be deleted from here.</p> : (
            <>
              <p className="text-sm text-ink-soft"><b>This is permanent.</b> Your profile, projects, applications, session requests, endorsements, messages and uploaded images are erased and you&apos;re signed out. {u.role === "EMPLOYER" && "If you're your company's only member, its open listings are closed."}</p>
              <ActionForm action={deleteMyAccount} submit="Delete everything" className="mt-4 space-y-3">
                <Field label="Type DELETE to confirm" name="confirm" required autoComplete="off" />
              </ActionForm>
            </>
          )}
        </Panel>
      </div>
    </>
  );
}
