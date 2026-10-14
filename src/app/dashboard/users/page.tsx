import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/session";
import { ActionButton, ActionForm, Field } from "@/components/dash/action-form";
import { Empty, PageTitle, Panel, Status, fmt } from "@/components/dash/ui";
import { suspendUser, unsuspendUser } from "@/app/actions/admin";
import { ConsoleForm, lbl } from "@/components/dash/console-form";
import { changeUserRole, decideRoleRequest } from "@/app/actions/console";
import { AddUserForm } from "@/components/dash/add-user-form";

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requirePageRole("PLATFORM_ADMIN");
  const { q = "" } = await searchParams;
  const needle = q.trim();
  const users = await db.user.findMany({
    where: needle ? { OR: [{ email: { contains: needle } }, { name: { contains: needle } }] } : {},
    orderBy: [{ suspendedAt: "desc" }, { createdAt: "desc" }],
    take: 50,
    select: { id: true, name: true, email: true, role: true, createdAt: true, suspendedAt: true, suspendedReason: true },
  });
  const requests = await db.roleChangeRequest.findMany({ where: { status: "PENDING" }, orderBy: { createdAt: "asc" }, take: 50, include: { user: { select: { name: true, email: true } } } });
  const RN: Record<string, string> = { STUDENT: "Student", MENTOR: "Mentor", EMPLOYER: "Employer", COLLEGE_ADMIN: "College admin", PLATFORM_ADMIN: "Platform admin" };
  return (
    <>
      <PageTitle title="Users" sub="Add people directly (including HR at other companies), or suspend accounts that break the rules. Suspended users are signed out at once, can't log in, and their profile or listings disappear from public pages. Fully reversible." />
      {requests.length > 0 && <Panel title={`Role requests (${requests.length})`} className="mb-6"><ul className="divide-y divide-line">{requests.map((r) => (
        <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="font-semibold">{r.user.name} <span className="font-normal text-ink-soft">· {RN[r.fromRole]} → {RN[r.requestedRole]}</span></p><p className="text-sm text-ink-soft">{r.user.email} · “{r.reason}”</p></div>
          <div className="flex gap-2"><ActionButton variant="dark" confirm={r.requestedRole === "PLATFORM_ADMIN" ? "Platform admins can see and change everything. Approve?" : undefined} action={decideRoleRequest.bind(null, r.id, true)}>Approve</ActionButton><ActionButton action={decideRoleRequest.bind(null, r.id, false)}>Decline</ActionButton></div></li>))}</ul></Panel>}
      <Panel title="Add a user" className="mb-6"><AddUserForm /></Panel>
      <form className="card mb-6 flex flex-wrap gap-3 p-4" role="search"><input name="q" defaultValue={q} placeholder="Search name or email" aria-label="Search users" className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-surface px-3" /><button className="h-11 rounded-lg bg-accent px-6 font-semibold text-black">Search</button></form>
      <Panel>{users.length ? <ul className="divide-y divide-line">{users.map((u) => (
        <li key={u.id} className="py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><p className="font-semibold">{u.name} <span className="font-normal text-ink-soft">· {u.role.replace("_", " ").toLowerCase()} · joined {fmt(u.createdAt)}</span></p><p className="text-sm text-ink-soft">{u.email}</p>{u.suspendedAt && <p className="mt-1 text-sm text-danger">Suspended {fmt(u.suspendedAt)}: {u.suspendedReason}</p>}</div>
            <div className="flex items-center gap-2">{u.suspendedAt && <Status s="REJECTED" />}{u.suspendedAt ? <ActionButton action={unsuspendUser.bind(null, u.id)}>Restore</ActionButton> : null}</div>
          </div>
          <details className="mt-2"><summary className="cursor-pointer text-sm font-semibold text-ink-soft">Change role…</summary>
            <ConsoleForm action={changeUserRole} label={`Change role for ${u.name}`} submit="Change role" className="mt-3 flex max-w-md flex-wrap items-end gap-3"><input type="hidden" name="userId" value={u.id} />
              <label className={lbl}>Role<select name="role" defaultValue={u.role} className="mt-1 block h-11 rounded-xl border border-line bg-surface px-3">{Object.entries(RN).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label></ConsoleForm>
            <p className="mt-1 text-xs text-ink-soft">Their account and data stay as they are; only what they can open changes.</p></details>
          {!u.suspendedAt && u.role !== "PLATFORM_ADMIN" && (
            <details className="mt-2"><summary className="cursor-pointer text-sm font-semibold text-ink-soft">Suspend…</summary>
              <ActionForm action={suspendUser} submit="Suspend account" success="Suspended" className="mt-3 max-w-md space-y-3"><input type="hidden" name="userId" value={u.id} /><Field label="Reason (sent to the user)" name="reason" required minLength={5} maxLength={300} /></ActionForm></details>
          )}
        </li>))}</ul> : <Empty>No users match.</Empty>}</Panel>
    </>
  );
}
