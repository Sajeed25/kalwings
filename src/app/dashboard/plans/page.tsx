import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/session";
import { Empty, PageTitle, Panel, Status } from "@/components/dash/ui";
import { ActionButton } from "@/components/dash/action-form";
import { setPlan } from "@/app/actions/admin";
import { PLAN_LIMITS, usage } from "@/lib/plans";

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requirePageRole("PLATFORM_ADMIN");
  const q = (await searchParams).q?.trim().slice(0, 60);
  const companies = await db.company.findMany({ where: { status: "VERIFIED", ...(q ? { name: { contains: q } } : {}) }, orderBy: { name: "asc" }, take: 60 });
  const rows = await Promise.all(companies.map(async (c) => ({ c, u: await usage(c.id) })));
  return (
    <>
      <PageTitle title="Employer plans" sub="Plans limit active listings, challenges, assessments and team size. Set them by hand until an online payment provider is connected." />
      <form className="card mb-6 flex gap-3 p-4" role="search"><input name="q" defaultValue={q} placeholder="Company name" className="h-11 flex-1 rounded-xl border border-line bg-surface px-3" /><button className="h-11 rounded-lg bg-accent px-6 font-semibold text-black">Search</button></form>
      <Panel>{rows.length ? <ul className="divide-y divide-line">{rows.map(({ c, u }) => (
        <li key={c.id} className="py-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold">{c.name}</p><p className="text-sm text-ink-soft">Listings {u.listings}/{PLAN_LIMITS[c.plan].listings} · Challenges {u.challenges}/{PLAN_LIMITS[c.plan].challenges} · Assessments {u.assessments}/{PLAN_LIMITS[c.plan].assessments} · Team {u.team}/{PLAN_LIMITS[c.plan].team}</p></div><Status s={c.plan} /></div>
          <div className="mt-2 flex flex-wrap gap-2">{(["STARTER", "GROWTH", "ENTERPRISE"] as const).map((p) => <ActionButton key={p} variant={c.plan === p ? "dark" : "secondary"} action={setPlan.bind(null, c.id, p)}>{PLAN_LIMITS[p].label}</ActionButton>)}</div></li>))}</ul> : <Empty>No verified companies.</Empty>}</Panel>
    </>
  );
}
