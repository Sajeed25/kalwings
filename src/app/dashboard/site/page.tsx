import { requirePageRole } from "@/lib/session";
import { PageTitle, Panel } from "@/components/dash/ui";
import { inputCls } from "@/components/dash/action-form";
import { ConsoleForm, hint, lbl } from "@/components/dash/console-form";
import { saveSettings } from "@/app/actions/console";
import { ROLE_NAME, SIGNUP_ROLES, getSettings } from "@/lib/settings";

export default async function Page() {
  await requirePageRole("PLATFORM_ADMIN");
  const s = await getSettings();
  return (
    <>
      <PageTitle title="Site settings" sub="Small controls you can change without a developer. Changes show straight away." />
      <Panel>
        <ConsoleForm action={saveSettings} label="Site settings" submit="Save settings" className="grid gap-5">
          <label className={lbl}>Announcement banner<input name="announcement" maxLength={300} defaultValue={s.announcement} className={inputCls} /><span className={hint}>Shown at the top of every signed-in page and on the sign-in page. Leave empty to hide it.</span></label>
          <label className={lbl}>Support email<input name="supportEmail" type="email" maxLength={254} defaultValue={s.supportEmail} className={inputCls} /><span className={hint}>Shown on the help and contact pages as the address people write to.</span></label>
          <fieldset><legend className={lbl}>Who can create a new account</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">{SIGNUP_ROLES.map((r) => <label key={r} className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" name={`signup_${r}`} defaultChecked={s.signup[r]} /> {ROLE_NAME[r]} can join</label>)}</div>
            <span className={hint}>Untick a role to close sign-up for it. People who already have an account can still sign in, and you can still add anyone from Users.</span></fieldset>
        </ConsoleForm>
      </Panel>
    </>
  );
}
