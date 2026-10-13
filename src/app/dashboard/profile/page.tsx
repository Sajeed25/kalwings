import { db } from "@/lib/db";
import { asList } from "@/lib/lists";
import { requirePageRole } from "@/lib/session";
import { ActionForm, Area, Field, ActionButton } from "@/components/dash/action-form";
import { PageTitle, Panel } from "@/components/dash/ui";
import { saveCollege, saveProfile, toggleContactVisible } from "@/app/actions/student";
import { ImageUpload } from "@/components/dash/image-upload";

export default async function Page() {
  const u = await requirePageRole("STUDENT");
  const p = await db.studentProfile.findUniqueOrThrow({ where: { userId: u.id } });
  const colleges = await db.college.findMany({ where: { status: "VERIFIED" }, orderBy: { name: "asc" } });
  return (
    <>
      <PageTitle title="Profile" />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Panel>
          <ActionForm action={saveProfile}>
            <Field label="Full name" name="name" defaultValue={u.name} required />
            <Field label="Headline" name="headline" defaultValue={p.headline ?? ""} required />
            <div className="grid gap-4 sm:grid-cols-2"><Field label="Graduation year" name="graduationYear" type="number" defaultValue={p.graduationYear ?? ""} required /><Field label="City" name="city" defaultValue={p.city ?? ""} /></div>
            <Field label="Skills (comma-separated)" name="skills" defaultValue={asList(p.skillsClaimed).join(", ")} hint="Self-declared. Verified badges come only from evidence." />
            <Area label="Bio" name="bio" defaultValue={p.bio ?? ""} />
            <Field label="GitHub" name="githubUrl" type="url" defaultValue={p.githubUrl ?? ""} />
            <Field label="Looking for" name="lookingFor" defaultValue={p.lookingFor ?? ""} />
          </ActionForm>
        </Panel>
        <div className="space-y-6">
        <Panel title="Photo"><ImageUpload kind="AVATAR" label="Upload photo" round maxDim={512} currentUrl={p.avatarId ? `/api/files/${p.avatarId}` : null} /></Panel>
        <Panel title="College">
          <ActionForm action={saveCollege} submit="Save college" className="space-y-3">
            <label className="block text-sm font-semibold">Your college
              <select name="collegeId" defaultValue={p.collegeId ?? ""} className="mt-1.5 h-11 w-full rounded-xl border border-line bg-surface px-3"><option value="">Not listed / none</option>{colleges.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.city}</option>)}</select>
            </label>
            <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="share" defaultChecked={p.shareWithCollege} className="mt-1 h-4 w-4 accent-teal-600" /><span>Let my college&apos;s placement team see my name, headline and progress. <span className="text-ink-soft">Never your email or phone. You can turn this off any time.</span></span></label>
          </ActionForm>
        </Panel>
        <Panel title="Privacy">
          <p className="text-sm text-ink-soft">Your email and phone are <b>private by default</b>. Employers only see them if you opt in below.</p>
          <p className="mt-4 text-sm">Contact details: <b>{p.contactVisible ? "visible to verified employers you apply to" : "hidden"}</b></p>
          <div className="mt-3"><ActionButton action={toggleContactVisible}>{p.contactVisible ? "Hide my contact details" : "Share with employers I apply to"}</ActionButton></div>
        </Panel>
        </div>
      </div>
    </>
  );
}
