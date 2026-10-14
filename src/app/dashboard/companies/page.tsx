import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/session";
import { Empty, PageTitle, Panel, Status } from "@/components/dash/ui";
import { inputCls } from "@/components/dash/action-form";
import { ConsoleForm, hint, lbl } from "@/components/dash/console-form";
import { saveCompany } from "@/app/actions/console";
import { allPlans } from "@/lib/plans";
import { CompanyLogo } from "@/components/ui/company-logo";

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  await requirePageRole("PLATFORM_ADMIN");
  const sp = await searchParams;
  const q = sp.q?.trim().slice(0, 60);
  const status = ["PENDING", "VERIFIED", "REJECTED"].includes(sp.status ?? "") ? (sp.status as "PENDING" | "VERIFIED" | "REJECTED") : undefined;
  const [plans, companies] = await Promise.all([
    allPlans(),
    db.company.findMany({ where: { ...(q ? { name: { contains: q } } : {}), ...(status ? { status } : {}) }, orderBy: [{ status: "asc" }, { name: "asc" }], take: 100, include: { _count: { select: { members: true, opportunities: true } } } }),
  ]);
  const label = new Map(plans.map((p) => [p.key, p.label]));
  return (
    <>
      <PageTitle title="Companies" sub="Add companies directly, verify or reject them, set their plan, and post listings on their behalf. Add the people who work there from Users, or from the company page." />
      <Panel title="Add a company" className="mb-6">
        <ConsoleForm action={saveCompany} label="Add a company" submit="Add company" resetOnSuccess>
          <label className={lbl}>Company name<input name="name" required minLength={2} maxLength={120} className={inputCls} /></label>
          <label className={lbl}>Website (optional)<input name="website" type="url" placeholder="https://" maxLength={400} className={inputCls} /></label>
          <label className={lbl + " sm:col-span-2"}>About (optional)<textarea name="about" rows={3} maxLength={1500} className={inputCls} /></label>
          <label className={lbl}>Status<select name="status" defaultValue="VERIFIED" className={inputCls + " h-11"}><option value="VERIFIED">Verified (can post and search)</option><option value="PENDING">Pending</option><option value="REJECTED">Rejected</option></select></label>
          <label className={lbl}>Plan<select name="plan" defaultValue={plans.find((p) => p.active)?.key} className={inputCls + " h-11"}>{plans.filter((p) => p.active).map((p) => <option key={p.key} value={p.key}>{p.label} · {p.priceText}</option>)}</select><span className={hint}>Add the logo and HR people on the company page after saving.</span></label>
        </ConsoleForm>
      </Panel>
      <form className="card mb-6 flex flex-wrap gap-3 p-4" role="search"><input name="q" defaultValue={q} placeholder="Company name" aria-label="Company name" className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-surface px-3" />
        <select name="status" defaultValue={status ?? ""} aria-label="Status" className="h-11 rounded-xl border border-line bg-surface px-3"><option value="">Any status</option><option value="PENDING">Pending</option><option value="VERIFIED">Verified</option><option value="REJECTED">Rejected</option></select>
        <button className="h-11 rounded-lg bg-accent px-6 font-semibold text-black">Search</button></form>
      <Panel>{companies.length ? <ul className="divide-y divide-line">{companies.map((c) => (
        <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
          <div className="flex items-center gap-3"><CompanyLogo name={c.name} logoId={c.logoId} className="h-10 w-10" /><div><Link href={`/dashboard/companies/${c.id}`} className="font-semibold text-accent underline-offset-2 hover:underline">{c.name}</Link>{c.isSample && <span className="ml-2 text-xs text-ink-soft">Sample</span>}<p className="text-sm text-ink-soft">{label.get(c.plan) ?? c.plan} plan · {c._count.members} team · {c._count.opportunities} listing{c._count.opportunities === 1 ? "" : "s"}</p></div></div>
          <Status s={c.status} />
        </li>))}</ul> : <Empty>No companies match.</Empty>}</Panel>
    </>
  );
}
