import { requirePageRole } from "@/lib/session";
import { ActionForm, Field } from "@/components/dash/action-form";
import { PageTitle, Panel } from "@/components/dash/ui";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { ConsoleForm, lbl } from "@/components/dash/console-form";
import { inputCls } from "@/components/dash/action-form";
import { ActionButton } from "@/components/dash/action-form";
import { cancelRoleRequest, requestRoleChange } from "@/app/actions/console";
import { LanguageSwitcher } from "@/components/language-switcher";
import { PushToggle } from "@/components/push-toggle";
import { InstallApp } from "@/components/install-app";
import { Appearance } from "@/components/dash/appearance";
import { deleteMyAccount, removePassword, setPassword } from "@/app/actions/account";
import { sessionAgeSeconds } from "@/lib/session";
import { PASSWORD_MIN } from "@/lib/password";

export default async function Page() {
  const u = await requirePageRole();
  const fresh = (await sessionAgeSeconds()) <= 600;
  const hasPw = !!u.passwordHash;
  const reqs = await db.roleChangeRequest.findMany({ where: { userId: u.id }, orderBy: { createdAt: "desc" }, take: 5 });
  const pending = reqs.find((r) => r.status === "PENDING");
  const RN: Record<string, string> = { STUDENT: "Student", MENTOR: "Mentor", EMPLOYER: "Employer", COLLEGE_ADMIN: "College admin", PLATFORM_ADMIN: "Platform admin" };
  return (
    <>
      <PageTitle title="Settings" sub="Appearance, sign-in, and your data: download it any time, or delete it." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Appearance"><Appearance /></Panel>
        <Panel title="Install the app"><p className="mb-3 text-sm text-ink-soft">Put Kalwings on your home screen or desktop. It opens full screen like an app and keeps working for the pages you have open when your connection drops.</p><InstallApp /></Panel>
        <Panel title="Notifications on this device"><PushToggle /></Panel>
        <Panel title="Language (beta)"><LanguageSwitcher /><p className="mt-2 text-sm text-ink-soft">Menus and the footer are available in Hindi and Telugu. Other pages are still in English.</p></Panel>
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
        <Panel title="Change my role">
          <p className="text-sm text-ink-soft">You are signed in as <b>{RN[u.role]}</b>. If you need a different role, ask an admin. Nothing changes until they approve, and your account and data stay as they are.</p>
          {pending ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm"><p>Waiting for an admin: <b>{RN[pending.requestedRole]}</b> · “{pending.reason}”</p><ActionButton action={cancelRoleRequest.bind(null, pending.id)}>Withdraw request</ActionButton></div>
          ) : (
            <ConsoleForm action={requestRoleChange} label="Request a role change" submit="Send request" className="mt-4 grid gap-3" resetOnSuccess>
              <label className={lbl}>I need to be a<select name="role" className={inputCls + " h-11"}>{Object.entries(RN).filter(([v]) => v !== u.role).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
              <label className={lbl}>Why?<textarea name="reason" required minLength={10} maxLength={500} rows={3} className={inputCls} /></label>
            </ConsoleForm>)}
          {reqs.filter((r) => r.status !== "PENDING").slice(0, 2).map((r) => <p key={r.id} className="mt-3 text-xs text-ink-soft">Earlier request for {RN[r.requestedRole]}: {r.status.toLowerCase()}.</p>)}
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
