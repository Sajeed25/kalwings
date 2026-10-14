import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/session";
import { ActionButton, ActionForm, Area, Field } from "@/components/dash/action-form";
import { PageTitle, Panel, Status, fmt } from "@/components/dash/ui";
import { acceptInvite, deleteTemplate, saveCareerSlug, saveTemplate, cancelInvite, createCompany, inviteMember, removeMember, saveStageLabels } from "@/app/actions/employer";
import { DEFAULT_LABEL, stageLabels } from "@/lib/stages";
import { PLAN_LIMITS, usage } from "@/lib/plans";
import Link from "next/link";
import { CopyButton } from "@/components/dash/copy-button";
import { site } from "@/lib/site";

export default async function Page() {
  const u = await requirePageRole("EMPLOYER");
  const mem = await db.employerMember.findUnique({ where: { userId: u.id }, include: { company: true } });
  const pendingInvites = !mem && u.email ? await db.companyInvite.findMany({ where: { email: u.email.toLowerCase(), acceptedAt: null }, include: { company: true } }) : [];
  const team = mem ? await db.employerMember.findMany({ where: { companyId: mem.companyId }, include: { user: { select: { name: true, email: true } } }, orderBy: { id: "asc" } }) : [];
  const invites = mem ? await db.companyInvite.findMany({ where: { companyId: mem.companyId, acceptedAt: null }, orderBy: { createdAt: "desc" } }) : [];
  const labels = mem ? stageLabels(mem.company.stageLabels) : DEFAULT_LABEL;
  const verified = mem?.company.status === "VERIFIED";
  const used = mem ? await usage(mem.companyId) : null;
  const templates = mem ? await db.messageTemplate.findMany({ where: { companyId: mem.companyId }, orderBy: { name: "asc" } }) : [];
  return (
    <>
      <PageTitle title="Company" sub="Every company is reviewed before it can post roles or search talent." />
      {mem ? (
        <div className="space-y-6">
          <Panel><div className="flex items-center justify-between"><h2 className="text-xl">{mem.company.name}</h2><Status s={mem.company.status} /></div>
            <p className="mt-2 text-sm text-ink-soft">{mem.company.website}</p>{mem.company.about && <p className="mt-2">{mem.company.about}</p>}
            <p className="mt-4 text-sm text-ink-soft">{mem.company.status === "PENDING" ? "We'll notify you once the review is done." : verified ? "You can post roles and search talent." : "This company was not approved. Contact support to appeal."}</p></Panel>
          {verified && used && mem && (
            <Panel title={`${PLAN_LIMITS[mem.company.plan].label} plan`}>
              <ul className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">{(["listings", "challenges", "assessments", "team"] as const).map((k) => <li key={k} className="rounded-lg border border-line p-3"><p className="text-ink-soft">{k === "team" ? "Team seats" : k[0].toUpperCase() + k.slice(1)}</p><p className="font-display text-xl font-bold">{used[k]} / {PLAN_LIMITS[mem.company.plan][k]}</p></li>)}</ul>
              <p className="mt-3 text-xs text-ink-soft">Limits count active items only. To change plan, <Link className="underline" href="/contact?topic=employer">contact us</Link>; online payments are not available yet.</p>
            </Panel>)}
          {verified && (
            <div className="grid gap-6 lg:grid-cols-2">
              <Panel title="Recruiting team">
                <ul className="divide-y divide-line text-sm">{team.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-2 py-2"><span><b>{m.user.name}</b> <span className="text-ink-soft">{m.user.email}</span>{m.userId === u.id && " (you)"}</span>
                    {m.userId !== u.id && <ActionButton variant="ghost" confirm={`Remove ${m.user.name} from the team?`} action={removeMember.bind(null, m.id)}>Remove</ActionButton>}</li>))}</ul>
                {invites.length > 0 && <><h3 className="mt-4 text-sm font-semibold">Pending invitations</h3><ul className="mt-1 divide-y divide-line text-sm">{invites.map((i) => (
                  <li key={i.id} className="flex items-center justify-between gap-2 py-2"><span>{i.email} <span className="text-ink-soft">· {fmt(i.createdAt)}</span></span><ActionButton variant="ghost" action={cancelInvite.bind(null, i.id)}>Cancel</ActionButton></li>))}</ul></>}
                <ActionForm action={inviteMember} reset submit="Send invitation" success="Invitation saved" className="mt-4 space-y-2">
                  <Field label="Invite a colleague by email" name="email" type="email" required hint="They sign up as an Employer with this email, then accept under Company. Up to 10 members." />
                </ActionForm>
              </Panel>
              <Panel title="Free career page and job distribution">
                <ActionForm action={saveCareerSlug} submit="Save address" className="space-y-3">
                  <Field label="Career page address" name="slug" defaultValue={mem.company.slug ?? ""} placeholder="acme-labs" hint={`Your page: ${site.url}/careers/${mem.company.slug ?? "your-name"}. Leave empty to turn it off.`} />
                </ActionForm>
                {mem.company.slug && <ul className="mt-3 space-y-1 text-sm">
                  <li><Link className="font-semibold underline" href={`/careers/${mem.company.slug}`}>Open career page</Link> · <CopyButton text={`${site.url}/careers/${mem.company.slug}`} label="Copy link" /></li>
                  <li>Embed on your website: <CopyButton text={`<iframe src="${site.url}/embed/careers/${mem.company.slug}" title="Open roles at ${mem.company.name.replace(/"/g, "")}" width="100%" height="600" style="border:0"></iframe>`} label="Copy embed code" /></li></ul>}
                <p className="mt-3 text-xs text-ink-soft">Approved listings also appear in Google-friendly structured data, our sitemap and an open job feed (<a className="underline" href="/feeds/jobs.xml">XML</a> · <a className="underline" href="/feeds/jobs.json">JSON</a>). We do not post to LinkedIn, Indeed or other boards for you; use the Share buttons on each listing. Job sites decide for themselves whether to read our feed.</p>
              </Panel>
              <Panel title="Message templates">
                {templates.length > 0 && <ul className="divide-y divide-line text-sm">{templates.map((t) => <li key={t.id} className="flex items-start justify-between gap-2 py-2"><span><b>{t.name}</b><span className="block text-ink-soft">{t.body}</span></span><ActionButton variant="ghost" confirm="Delete this template?" action={deleteTemplate.bind(null, t.id)}>Delete</ActionButton></li>)}</ul>}
                <ActionForm action={saveTemplate} reset submit="Save template" success="Saved" className="mt-3 space-y-2">
                  <Field label="Template name" name="name" required maxLength={60} placeholder="Interview invite" />
                  <Area label="Message" name="body" required minLength={10} maxLength={1000} hint="Insert it from the message box in your pipeline, then edit before sending." />
                </ActionForm>
              </Panel>
              <Panel title="Pipeline stage names">
                <ActionForm action={saveStageLabels} submit="Save names" className="space-y-3">
                  <p className="text-sm text-ink-soft">Rename stages to match your process. The stages themselves stay the same, so reports remain comparable.</p>
                  {(["UNDER_REVIEW", "SHORTLISTED", "INTERVIEW", "OFFER", "HIRED"] as const).map((s) => <Field key={s} label={DEFAULT_LABEL[s]} name={s} defaultValue={labels[s] === DEFAULT_LABEL[s] ? "" : labels[s]} placeholder={DEFAULT_LABEL[s]} maxLength={24} />)}
                </ActionForm>
              </Panel>
            </div>)}
        </div>
      ) : (
        <div className="space-y-6">
          {pendingInvites.length > 0 && <Panel title="You have been invited">{pendingInvites.map((i) => (
            <div key={i.id} className="flex flex-wrap items-center justify-between gap-3"><p>{i.company.name} invited you to join their recruiting team.</p><ActionButton variant="primary" action={acceptInvite.bind(null, i.id)}>Join {i.company.name}</ActionButton></div>))}</Panel>}
          <Panel><ActionForm action={createCompany} submit="Submit for verification" success="Submitted"><Field label="Company name" name="name" required /><Field label="Website" name="website" type="url" required hint="We use this to verify the company." /><Area label="About" name="about" /></ActionForm>
            {!pendingInvites.length && <p className="mt-4 text-sm text-ink-soft">Joining a colleague&apos;s company? Ask them to invite your email, then come back to this page.</p>}</Panel>
        </div>
      )}
    </>
  );
}
