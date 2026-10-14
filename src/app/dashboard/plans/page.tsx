import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/session";
import { Empty, PageTitle, Panel, Status } from "@/components/dash/ui";
import { ActionButton, inputCls } from "@/components/dash/action-form";
import { ConsoleForm, hint, lbl } from "@/components/dash/console-form";
import { setPlan } from "@/app/actions/admin";
import { deletePlan, savePlan } from "@/app/actions/console";
import { allPlans, usage, type PlanRow } from "@/lib/plans";

function PlanFields({ p }: { p?: PlanRow }) {
  const num = (name: string, label: string, v: number | undefined, min = 0) => <label className={lbl}>{label}<input name={name} type="number" min={min} max={100000} required defaultValue={v} className={inputCls} /></label>;
  return (
    <>
      {p ? <input type="hidden" name="key" value={p.key} /> : <label className={lbl}>Plan key<input name="key" required pattern="[A-Za-z][A-Za-z0-9_]{1,39}" placeholder="PRO" className={inputCls} /><span className={hint}>Capital letters, numbers and underscores. It cannot be changed later.</span></label>}
      <label className={lbl}>Plan name<input name="label" required maxLength={60} defaultValue={p?.label} className={inputCls} /></label>
      <label className={lbl}>Price shown to employers<input name="priceText" required maxLength={80} defaultValue={p?.priceText} placeholder="₹2,999 / month" className={inputCls} /></label>
      <label className={lbl}>Short description<input name="description" maxLength={300} defaultValue={p?.description ?? ""} className={inputCls} /></label>
      <label className={lbl + " sm:col-span-2"}>What is included (one line each)<textarea name="features" rows={4} maxLength={1500} defaultValue={(p?.features ?? []).join("\n")} className={inputCls} /></label>
      {num("listings", "Active listings", p?.listings)}
      {num("challenges", "Open challenges", p?.challenges)}
      {num("assessments", "Active assessments", p?.assessments)}
      {num("team", "Team members", p?.team, 1)}
      {num("position", "Order (lowest first)", p?.position ?? 0)}
      <div className="flex flex-wrap items-center gap-6 text-sm font-semibold">
        <label className="flex items-center gap-2"><input type="checkbox" name="highlight" defaultChecked={p?.highlight} /> Highlight as recommended</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="active" defaultChecked={p?.active ?? true} /> Available to assign</label>
      </div>
    </>
  );
}

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requirePageRole("PLATFORM_ADMIN");
  const q = (await searchParams).q?.trim().slice(0, 60);
  const [plans, companies, counts] = await Promise.all([
    allPlans(),
    db.company.findMany({ where: { status: "VERIFIED", ...(q ? { name: { contains: q } } : {}) }, orderBy: { name: "asc" }, take: 60 }),
    db.company.groupBy({ by: ["plan"], _count: { _all: true } }),
  ]);
  const byKey = new Map(plans.map((p) => [p.key, p]));
  const used = new Map(counts.map((c) => [c.plan, c._count._all]));
  const rows = await Promise.all(companies.map(async (c) => ({ c, u: await usage(c.id) })));
  return (
    <>
      <PageTitle title="Employer plans" sub="Rename plans, change prices and limits, add new plans, then assign them to companies. Changes apply to every company on the plan at once. Set plans by hand until an online payment provider is connected." />
      <div className="space-y-4">
        {plans.map((p) => (
          <Panel key={p.key} title={`${p.label} · ${p.priceText}`}><p className="-mt-2 mb-4 text-sm text-ink-soft">{`${used.get(p.key) ?? 0} compan${(used.get(p.key) ?? 0) === 1 ? "y" : "ies"} · key ${p.key}${p.active ? "" : " · switched off"}`}</p>
            <ConsoleForm action={savePlan} label={`Edit plan ${p.label}`} submit="Save plan"><PlanFields p={p} /></ConsoleForm>
            <div className="mt-3"><ActionButton variant="secondary" confirm={`Delete the ${p.label} plan?`} action={deletePlan.bind(null, p.key)}>Delete plan</ActionButton></div>
          </Panel>
        ))}
        <Panel title="Add a plan"><p className="-mt-2 mb-4 text-sm text-ink-soft">For example a Campus or Pro plan with its own price and limits.</p>
          <ConsoleForm action={savePlan} label="Add a plan" submit="Add plan" resetOnSuccess><input type="hidden" name="isNew" value="1" /><PlanFields /></ConsoleForm>
        </Panel>
      </div>
      <h2 className="mb-3 mt-10 text-lg font-bold">Assign plans to companies</h2>
      <form className="card mb-6 flex flex-wrap gap-3 p-4" role="search"><input name="q" defaultValue={q} placeholder="Company name" aria-label="Company name" className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-surface px-3" /><button className="h-11 rounded-lg bg-accent px-6 font-semibold text-black">Search</button></form>
      <Panel>{rows.length ? <ul className="divide-y divide-line">{rows.map(({ c, u }) => {
        const lim = byKey.get(c.plan) ?? plans[0];
        return (
          <li key={c.id} className="py-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold">{c.name}</p><p className="text-sm text-ink-soft">Listings {u.listings}/{lim.listings} · Challenges {u.challenges}/{lim.challenges} · Assessments {u.assessments}/{lim.assessments} · Team {u.team}/{lim.team}</p></div><Status s={byKey.get(c.plan)?.label ?? c.plan} /></div>
            <div className="mt-2 flex flex-wrap gap-2">{plans.filter((p) => p.active || p.key === c.plan).map((p) => <ActionButton key={p.key} variant={c.plan === p.key ? "dark" : "secondary"} action={setPlan.bind(null, c.id, p.key)}>{p.label}</ActionButton>)}</div></li>);
      })}</ul> : <Empty>No verified companies.</Empty>}</Panel>
    </>
  );
}
