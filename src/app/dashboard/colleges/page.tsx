import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/session";
import { Empty, PageTitle, Panel, Status } from "@/components/dash/ui";
import { inputCls } from "@/components/dash/action-form";
import { ConsoleForm, lbl } from "@/components/dash/console-form";
import { saveCollege } from "@/app/actions/console";

const StatusSelect = ({ v = "VERIFIED" }: { v?: string }) => <label className={lbl}>Status<select name="status" defaultValue={v} className={inputCls + " h-11"}><option value="VERIFIED">Verified (students can pick it)</option><option value="PENDING">Pending</option><option value="REJECTED">Rejected</option></select></label>;

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requirePageRole("PLATFORM_ADMIN");
  const q = (await searchParams).q?.trim().slice(0, 60);
  const colleges = await db.college.findMany({ where: q ? { name: { contains: q } } : {}, orderBy: [{ status: "asc" }, { name: "asc" }], take: 100, include: { _count: { select: { students: true, admins: true } } } });
  return (
    <>
      <PageTitle title="Colleges" sub="Add colleges directly and verify the ones students can pick. Add a college admin from Users." />
      <Panel title="Add a college" className="mb-6">
        <ConsoleForm action={saveCollege} label="Add a college" submit="Add college" resetOnSuccess>
          <label className={lbl}>College name<input name="name" required minLength={2} maxLength={160} className={inputCls} /></label>
          <label className={lbl}>City (optional)<input name="city" maxLength={80} className={inputCls} /></label>
          <StatusSelect />
        </ConsoleForm>
      </Panel>
      <form className="card mb-6 flex flex-wrap gap-3 p-4" role="search"><input name="q" defaultValue={q} placeholder="College name" aria-label="College name" className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-surface px-3" /><button className="h-11 rounded-lg bg-accent px-6 font-semibold text-black">Search</button></form>
      <Panel>{colleges.length ? <ul className="divide-y divide-line">{colleges.map((c) => (
        <li key={c.id} className="py-4">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold">{c.name}</p><p className="text-sm text-ink-soft">{c.city ?? "No city"} · {c._count.students} student{c._count.students === 1 ? "" : "s"} · {c._count.admins} admin{c._count.admins === 1 ? "" : "s"}</p></div><Status s={c.status} /></div>
          <details className="mt-2"><summary className="cursor-pointer text-sm font-semibold text-ink-soft">Edit…</summary>
            <ConsoleForm action={saveCollege} label={`Edit ${c.name}`} submit="Save college" className="mt-3 grid max-w-2xl gap-4 sm:grid-cols-2"><input type="hidden" name="id" value={c.id} />
              <label className={lbl}>College name<input name="name" required minLength={2} maxLength={160} defaultValue={c.name} className={inputCls} /></label>
              <label className={lbl}>City<input name="city" maxLength={80} defaultValue={c.city ?? ""} className={inputCls} /></label>
              <StatusSelect v={c.status} /></ConsoleForm></details>
        </li>))}</ul> : <Empty>No colleges yet.</Empty>}</Panel>
    </>
  );
}
