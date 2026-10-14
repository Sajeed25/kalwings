import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/session";
import { site } from "@/lib/site";
import { ActionForm, Area, Field, ActionButton } from "@/components/dash/action-form";
import { Empty, PageTitle, Panel } from "@/components/dash/ui";
import { addEntry, deleteEntry, requestEntryVerification, savePrivacy, saveUsername } from "@/app/actions/student";
import { EntryLabel } from "@/components/passport/evidence";
import { KIND_LABEL, canonicalKey } from "@/lib/passport";

const sel = "mt-1.5 h-11 w-full rounded-lg border border-line bg-surface px-3 text-[15px]";
const VIS = [["PUBLIC", "Anyone with the link"], ["RECRUITERS", "Verified recruiters only"], ["PRIVATE", "Only me"]] as const;

function VisSelect({ name, label, value }: { name: string; label: string; value: string }) {
  return <label className="block text-sm font-semibold">{label}<select name={name} defaultValue={value} className={sel}>{VIS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>;
}

export default async function Page() {
  const u = await requirePageRole("STUDENT");
  const p = await db.studentProfile.findUniqueOrThrow({ where: { userId: u.id }, include: { entries: { orderBy: { createdAt: "desc" } } } });
  const key = canonicalKey(p);
  return (
    <>
      <PageTitle title="Talent Passport" sub="Your shareable professional identity. You decide who sees each part." />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Panel title="Your link">
            <p className="text-sm">Share: <a className="font-semibold underline" href={`/talent/${key}`}>{site.url}/talent/{key}</a></p>
            <p className="mt-1 text-sm"><a className="font-semibold underline" href={`/talent/${key}/resume`}>Open resume view</a> <span className="text-ink-soft">(print or save as PDF)</span></p>
            <ActionForm action={saveUsername} submit="Save username" className="mt-4 space-y-3">
              <Field label="Username" name="username" defaultValue={p.username ?? ""} placeholder="e.g. asha-rao" hint="3 to 30 letters, numbers, - or _. Changing it changes your link (old username links stop working; your original link keeps working)." />
            </ActionForm>
          </Panel>
          <Panel title="Privacy">
            <ActionForm action={savePrivacy} submit="Save privacy">
              <VisSelect name="passportVisibility" label="Whole Passport" value={p.passportVisibility} />
              <VisSelect name="projectsVisibility" label="Projects" value={p.projectsVisibility} />
              <VisSelect name="endorsementsVisibility" label="Mentor endorsements" value={p.endorsementsVisibility} />
              <VisSelect name="entriesVisibility" label="Experience, achievements, hackathons, certificates" value={p.entriesVisibility} />
              <p className="text-xs text-ink-soft">Your email is never shown on a Passport.</p>
            </ActionForm>
          </Panel>
        </div>
        <div className="space-y-6">
          <Panel title="Add an entry">
            <ActionForm action={addEntry} reset submit="Add entry" success="Entry added">
              <label className="block text-sm font-semibold">Type<select name="kind" className={sel}>{Object.entries(KIND_LABEL).map(([k, l]) => <option key={k} value={k}>{l.replace(/s$/, "")}</option>)}</select></label>
              <Field label="Title" name="title" required />
              <div className="grid gap-4 sm:grid-cols-2"><Field label="Organisation / issuer" name="org" /><Field label="Year" name="year" type="number" /></div>
              <Field label="Evidence link" name="url" type="url" hint="Needed if you want Kalwings to verify it." />
              <Area label="Summary" name="summary" />
            </ActionForm>
          </Panel>
          <Panel title="Your entries">
            {p.entries.length ? <ul className="space-y-3">{p.entries.map((e) => (
              <li key={e.id} className="rounded-xl border border-line p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">{e.title}</p><EntryLabel kind={e.kind} status={e.status} /></div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {e.status === "PENDING" && e.url && !e.verifyRequested && <ActionButton action={requestEntryVerification.bind(null, e.id)}>Request verification</ActionButton>}
                  {e.verifyRequested && e.status === "PENDING" && <span className="text-ink-soft">Verification requested</span>}
                  {e.status === "REJECTED" && <span className="text-danger">Could not be verified (hidden from others)</span>}
                  <ActionButton variant="ghost" confirm="Delete this entry?" action={deleteEntry.bind(null, e.id)}>Delete</ActionButton>
                </div>
              </li>))}</ul> : <Empty>No entries yet.</Empty>}
          </Panel>
        </div>
      </div>
    </>
  );
}
