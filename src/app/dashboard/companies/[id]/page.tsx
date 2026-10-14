import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/session";
import { Empty, PageTitle, Panel, Status, fmt } from "@/components/dash/ui";
import { ActionButton, inputCls } from "@/components/dash/action-form";
import { ConsoleForm, hint, lbl } from "@/components/dash/console-form";
import { ImageUpload } from "@/components/dash/image-upload";
import { adminSetListingClosed, postListingFor, saveCompany } from "@/app/actions/console";
import { createUser } from "@/app/actions/admin";
import { allPlans, usage } from "@/lib/plans";
import { TYPE_KEYS, TYPE_LABEL } from "@/lib/opportunity-types";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requirePageRole("PLATFORM_ADMIN");
  const { id } = await params;
  const company = await db.company.findUnique({
    where: { id },
    include: { members: { include: { user: { select: { name: true, email: true } } } }, opportunities: { orderBy: { createdAt: "desc" }, take: 30, select: { id: true, title: true, type: true, moderated: true, closedAt: true, deadline: true } } },
  });
  if (!company) notFound();
  const [plans, u] = await Promise.all([allPlans(), usage(id)]);
  const verified = company.status === "VERIFIED";
  return (
    <>
      <p className="mb-2 text-sm"><Link href="/dashboard/companies" className="font-semibold text-accent underline-offset-2 hover:underline">← All companies</Link></p>
      <PageTitle title={company.name} sub={`Listings ${u.listings}, challenges ${u.challenges}, assessments ${u.assessments}, team ${u.team}.`} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Company details">
          <div className="mb-5"><ImageUpload kind="COMPANY_LOGO" companyId={company.id} label="Upload logo" maxDim={512} currentUrl={company.logoId ? `/api/files/${company.logoId}` : null} /></div>
          <ConsoleForm action={saveCompany} label="Edit company" submit="Save company" className="grid gap-4"><input type="hidden" name="id" value={company.id} />
            <label className={lbl}>Company name<input name="name" required minLength={2} maxLength={120} defaultValue={company.name} className={inputCls} /></label>
            <label className={lbl}>Website<input name="website" type="url" maxLength={400} defaultValue={company.website ?? ""} className={inputCls} /></label>
            <label className={lbl}>About<textarea name="about" rows={4} maxLength={1500} defaultValue={company.about ?? ""} className={inputCls} /></label>
            <label className={lbl}>Career page address<input name="slug" maxLength={40} defaultValue={company.slug ?? ""} className={inputCls} /><span className={hint}>Optional. Lowercase letters, numbers and dashes: /careers/your-address</span></label>
            <label className={lbl}>Verification<select name="status" defaultValue={company.status} className={inputCls + " h-11"}><option value="VERIFIED">Verified</option><option value="PENDING">Pending</option><option value="REJECTED">Rejected</option></select></label>
            <label className={lbl}>Plan<select name="plan" defaultValue={company.plan} className={inputCls + " h-11"}>{plans.filter((p) => p.active || p.key === company.plan).map((p) => <option key={p.key} value={p.key}>{p.label} · {p.priceText}</option>)}</select></label>
          </ConsoleForm>
        </Panel>
        <Panel title="Team">
          {company.members.length ? <ul className="mb-5 divide-y divide-line">{company.members.map((m) => <li key={m.id} className="py-2 text-sm"><span className="font-semibold">{m.user.name}</span> <span className="text-ink-soft">· {m.user.email}</span></li>)}</ul> : <Empty>No one from this company has an account yet.</Empty>}
          <h3 className="mb-2 text-sm font-bold">Add HR or recruiter</h3>
          <ConsoleForm action={createUser} label="Add HR" submit="Add person" className="grid gap-4"><input type="hidden" name="role" value="EMPLOYER" /><input type="hidden" name="companyName" value={company.name} />
            <label className={lbl}>Name<input name="name" required minLength={2} maxLength={80} className={inputCls} /></label>
            <label className={lbl}>Email<input name="email" type="email" required className={inputCls} /></label>
          </ConsoleForm>
        </Panel>
      </div>
      <Panel title="Post a listing for this company" className="mt-6">
        {verified ? (
          <ConsoleForm action={postListingFor} label="Post a listing" submit="Post listing" resetOnSuccess><input type="hidden" name="companyId" value={company.id} />
            <label className={lbl}>Title<input name="title" required minLength={3} maxLength={120} className={inputCls} /></label>
            <label className={lbl}>Type<select name="type" className={inputCls + " h-11"}>{TYPE_KEYS.filter((t) => t !== "CHALLENGE").map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}</select></label>
            <label className={lbl + " sm:col-span-2"}>Description<textarea name="description" required minLength={30} maxLength={3000} rows={5} className={inputCls} /></label>
            <label className={lbl}>Pay (always shown)<input name="payText" required maxLength={80} placeholder="₹15,000 / month, or Unpaid — certificate" className={inputCls} /></label>
            <label className={lbl}>Monthly amount in ₹ (0 if unpaid)<input name="monthlyINR" type="number" min={0} max={1000000} defaultValue={0} className={inputCls} /></label>
            <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" name="unpaid" value="true" /> This is unpaid</label>
            <label className={lbl}>Work mode<select name="workMode" className={inputCls + " h-11"}><option value="REMOTE">Remote</option><option value="HYBRID">Hybrid</option><option value="ONSITE">On-site</option></select></label>
            <label className={lbl}>Location<input name="location" required maxLength={80} className={inputCls} /></label>
            <label className={lbl}>Eligibility<input name="eligibility" required maxLength={120} placeholder="B.E / B.Tech, 2026 batch" className={inputCls} /></label>
            <label className={lbl}>Graduation years (comma separated)<input name="gradYears" maxLength={60} placeholder="2026, 2027" className={inputCls} /></label>
            <label className={lbl}>Skills (comma separated)<input name="skills" maxLength={200} className={inputCls} /></label>
            <label className={lbl}>Apply deadline<input name="deadline" type="date" required className={inputCls} /></label>
            <label className={lbl + " sm:col-span-2"}>Screening questions (one per line, up to 5)<textarea name="questions" rows={3} className={inputCls} /></label>
          </ConsoleForm>
        ) : <p className="text-sm text-ink-soft">Verify this company first. Listings from an unverified company are never visible.</p>}
        <p className="mt-3 text-xs text-ink-soft">Listings you post go live at once and are not held back by the company&apos;s plan limits. They are logged in the audit log.</p>
      </Panel>
      <Panel title="Listings" className="mt-6">{company.opportunities.length ? <ul className="divide-y divide-line">{company.opportunities.map((o) => (
        <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="font-semibold">{o.title}</p><p className="text-sm text-ink-soft">{TYPE_LABEL[o.type as keyof typeof TYPE_LABEL] ?? o.type} · deadline {fmt(o.deadline)}{o.closedAt ? " · closed" : ""}</p></div>
          <div className="flex items-center gap-2"><Status s={o.moderated} /><ActionButton action={adminSetListingClosed.bind(null, o.id, !o.closedAt)}>{o.closedAt ? "Reopen" : "Close"}</ActionButton></div></li>))}</ul> : <Empty>No listings yet.</Empty>}</Panel>
    </>
  );
}
