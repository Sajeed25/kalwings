import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/session";
import { Empty, PageTitle, Panel, Status } from "@/components/dash/ui";
import { inputCls } from "@/components/dash/action-form";
import { ConsoleForm, hint, lbl } from "@/components/dash/console-form";
import { ImageUpload } from "@/components/dash/image-upload";
import { saveMentor } from "@/app/actions/console";
import { asList } from "@/lib/lists";

type M = { userId?: string; name?: string; email?: string; roleTitle?: string; company?: string; country?: string; domain?: string; tags?: string; bio?: string; status?: string };
function Fields({ m = {} }: { m?: M }) {
  return (
    <>
      <label className={lbl}>Name<input name="name" required minLength={2} maxLength={80} defaultValue={m.name} className={inputCls} /></label>
      <label className={lbl}>Email<input name="email" type="email" required maxLength={254} defaultValue={m.email} readOnly={!!m.userId} className={inputCls} />{m.userId ? <span className={hint}>The email is their sign-in and cannot be changed here.</span> : <span className={hint}>They sign in with a code sent here and can then update their own profile.</span>}</label>
      <label className={lbl}>Role<input name="roleTitle" required maxLength={120} defaultValue={m.roleTitle} placeholder="Senior Engineer" className={inputCls} /></label>
      <label className={lbl}>Company<input name="company" required maxLength={120} defaultValue={m.company} className={inputCls} /></label>
      <label className={lbl}>Country<input name="country" required maxLength={60} defaultValue={m.country} className={inputCls} /></label>
      <label className={lbl}>Domain<input name="domain" required maxLength={60} defaultValue={m.domain} placeholder="AI / ML" className={inputCls} /></label>
      <label className={lbl + " sm:col-span-2"}>Topics (comma separated)<input name="tags" maxLength={300} defaultValue={m.tags} className={inputCls} /></label>
      <label className={lbl + " sm:col-span-2"}>Bio<textarea name="bio" rows={4} maxLength={1500} defaultValue={m.bio} className={inputCls} /></label>
      <label className={lbl}>Status<select name="status" defaultValue={m.status ?? "VERIFIED"} className={inputCls + " h-11"}><option value="VERIFIED">Verified (visible to students)</option><option value="PENDING">Pending</option><option value="REJECTED">Rejected</option></select></label>
      {m.userId && <input type="hidden" name="userId" value={m.userId} />}
    </>
  );
}

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requirePageRole("PLATFORM_ADMIN");
  const q = (await searchParams).q?.trim().slice(0, 60);
  const mentors = await db.mentorProfile.findMany({
    where: q ? { OR: [{ user: { name: { contains: q } } }, { user: { email: { contains: q } } }, { company: { contains: q } }] } : {},
    orderBy: { id: "desc" }, take: 100, include: { user: { select: { id: true, name: true, email: true } } },
  });
  return (
    <>
      <PageTitle title="Mentors" sub="Add a mentor with every detail, or edit one. The mentor is emailed a sign-in link and can add or change any detail later under Mentor profile." />
      <Panel title="Add a mentor" className="mb-6"><ConsoleForm action={saveMentor} label="Add a mentor" submit="Add mentor" resetOnSuccess><Fields /></ConsoleForm></Panel>
      <form className="card mb-6 flex flex-wrap gap-3 p-4" role="search"><input name="q" defaultValue={q} placeholder="Name, email or company" aria-label="Search mentors" className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-surface px-3" /><button className="h-11 rounded-lg bg-accent px-6 font-semibold text-black">Search</button></form>
      <Panel>{mentors.length ? <ul className="divide-y divide-line">{mentors.map((m) => (
        <li key={m.id} className="py-4">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold">{m.user.name}{m.isSample && <span className="ml-2 text-xs font-normal text-ink-soft">Sample</span>}</p><p className="text-sm text-ink-soft">{m.roleTitle} · {m.company} · {m.country} · {m.user.email}</p></div><Status s={m.status} /></div>
          <details className="mt-2"><summary className="cursor-pointer text-sm font-semibold text-ink-soft">Edit…</summary>
            <div className="mt-3 max-w-3xl"><div className="mb-4"><ImageUpload kind="AVATAR" mentorId={m.id} label="Upload photo" round maxDim={512} currentUrl={m.avatarId ? `/api/files/${m.avatarId}` : null} /></div>
              <ConsoleForm action={saveMentor} label={`Edit ${m.user.name}`} submit="Save mentor"><Fields m={{ userId: m.user.id, name: m.user.name ?? "", email: m.user.email ?? "", roleTitle: m.roleTitle, company: m.company, country: m.country, domain: m.domain, tags: asList(m.tags).join(", "), bio: m.bio ?? "", status: m.status }} /></ConsoleForm></div></details>
        </li>))}</ul> : <Empty>No mentors yet.</Empty>}</Panel>
    </>
  );
}
