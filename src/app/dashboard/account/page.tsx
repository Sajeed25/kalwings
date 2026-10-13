import { requirePageRole } from "@/lib/session";
import { ActionForm, Field } from "@/components/dash/action-form";
import { PageTitle, Panel } from "@/components/dash/ui";
import { Button } from "@/components/ui/button";
import { deleteMyAccount } from "@/app/actions/account";

export default async function Page() {
  const u = await requirePageRole();
  return (
    <>
      <PageTitle title="Account & data" sub="Your data is yours: download it any time, or delete it." />
      <div className="grid gap-6 lg:grid-cols-2">
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
