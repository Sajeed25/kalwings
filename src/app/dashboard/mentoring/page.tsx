import Link from "next/link";
import { asList } from "@/lib/lists";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/session";
import { ActionButton, ActionForm, Area, Field } from "@/components/dash/action-form";
import { Empty, PageTitle, Panel, Status, fmt, fmtTime } from "@/components/dash/ui";
import { cancelSession } from "@/app/actions/student";
import { ImageUpload } from "@/components/dash/image-upload";
import { addSlot, deleteSlot, giveEndorsement, respondToSession, saveMentorProfile } from "@/app/actions/mentor";

export default async function Page() {
  const u = await requirePageRole("STUDENT", "MENTOR");
  return u.role === "STUDENT" ? <StudentView userId={u.id} /> : <MentorView userId={u.id} />;
}

async function StudentView({ userId }: { userId: string }) {
  const p = await db.studentProfile.findUniqueOrThrow({ where: { userId }, include: { sessions: { include: { mentor: { include: { user: true } } }, orderBy: { createdAt: "desc" } } } });
  return (
    <>
      <PageTitle title="Mentor sessions" sub="Request a session from a verified mentor." />
      <Panel action={<Link className="text-sm font-semibold underline" href="/mentors">Find a mentor</Link>}>
        {p.sessions.length ? <ul className="divide-y divide-line">{p.sessions.map((s) => <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="font-semibold">{s.topic}</p><p className="text-sm text-ink-soft">{s.mentor.user.name} · {s.startsAt ? `${fmtTime(s.startsAt)} IST` : `requested ${fmt(s.createdAt)}`}</p></div><div className="flex items-center gap-2"><Status s={s.status} />{(s.status === "ACCEPTED" || s.status === "COMPLETED") && s.startsAt && <a className="text-sm font-semibold underline" href={`/api/sessions/${s.id}/ics`}>Add to calendar</a>}{(s.status === "REQUESTED" || s.status === "ACCEPTED") && <ActionButton variant="ghost" confirm="Cancel this session?" action={cancelSession.bind(null, s.id)}>Cancel</ActionButton>}</div></li>)}</ul> : <Empty>No requests yet.</Empty>}
      </Panel>
    </>
  );
}

async function MentorView({ userId }: { userId: string }) {
  const m = await db.mentorProfile.findUnique({ where: { userId }, include: { slots: { where: { endsAt: { gt: new Date() } }, orderBy: { startsAt: "asc" } }, sessions: { include: { student: { include: { user: true } } }, orderBy: { createdAt: "desc" } } } });
  const completed = m ? [...new Map(m.sessions.filter((s) => s.status === "COMPLETED").map((s) => [s.studentId, s.student])).values()] : [];
  return (
    <>
      <PageTitle title="Mentor profile" sub={m ? `Status: ${m.status.toLowerCase()}. ${m.status === "PENDING" ? "Admins review new mentors before they're listed." : ""}` : "Tell students who you are."} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Profile">
          {m && <div className="mb-5"><ImageUpload kind="AVATAR" label="Upload photo" round maxDim={800} currentUrl={m.avatarId ? `/api/files/${m.avatarId}` : null} /></div>}
          <ActionForm action={saveMentorProfile}>
            <Field label="Role" name="roleTitle" defaultValue={m?.roleTitle} required />
            <Field label="Company" name="company" defaultValue={m?.company} required />
            <div className="grid gap-4 sm:grid-cols-2"><Field label="Country" name="country" defaultValue={m?.country} required /><Field label="Domain" name="domain" defaultValue={m?.domain} required placeholder="AI / ML, Design…" /></div>
            <Field label="Expertise tags (comma-separated)" name="tags" defaultValue={asList(m?.tags).join(", ")} />
            <Area label="Bio" name="bio" defaultValue={m?.bio ?? ""} />
          </ActionForm>
        </Panel>
        {m && (
          <Panel title="Office-hour slots">
            {m.slots.length ? <ul className="mb-4 divide-y divide-line">{m.slots.map((s) => <li key={s.id} className="flex items-center justify-between py-2 text-sm"><span>{fmtTime(s.startsAt)} – {s.endsAt.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" })}</span>{s.sessionId ? <Status s="BOOKED" /> : <ActionButton variant="ghost" action={deleteSlot.bind(null, s.id)}>Remove</ActionButton>}</li>)}</ul> : <Empty>No upcoming slots.</Empty>}
            <ActionForm action={addSlot} reset submit="Add slot" success="Slot added"><div className="grid gap-4 sm:grid-cols-2"><Field label="Starts (IST)" name="startsAt" type="datetime-local" required /><Field label="Minutes" name="minutes" type="number" min={15} max={120} step={15} defaultValue={30} required /></div></ActionForm>
          </Panel>
        )}
      </div>
      {m && (
        <>
          <Panel title="Session requests" className="mt-6">
            {m.sessions.length ? <ul className="divide-y divide-line">{m.sessions.map((s) => (
              <li key={s.id} className="py-3"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-semibold">{s.topic}</p><p className="text-sm text-ink-soft">{s.student.user.name}{s.startsAt && ` · ${fmtTime(s.startsAt)} IST`}{s.message && ` — “${s.message}”`}</p></div><Status s={s.status} /></div>
                <div className="mt-2 flex gap-2">{s.status === "REQUESTED" && <><ActionButton variant="primary" action={respondToSession.bind(null, s.id, "ACCEPTED")}>Accept</ActionButton><ActionButton action={respondToSession.bind(null, s.id, "DECLINED")}>Decline</ActionButton></>}{s.status === "ACCEPTED" && <><ActionButton action={respondToSession.bind(null, s.id, "COMPLETED")}>Mark completed</ActionButton>{s.startsAt && <a className="self-center text-sm font-semibold underline" href={`/api/sessions/${s.id}/ics`}>Add to calendar</a>}</>}</div></li>))}</ul> : <Empty>No requests yet.</Empty>}
          </Panel>
          <Panel title="Give an endorsement" className="mt-6">
            <p className="mb-4 text-sm text-ink-soft">Endorsements are only for students you&apos;ve completed a session with, and must link to the work you&apos;re vouching for. They appear as verified evidence on the student&apos;s Talent Card.</p>
            {completed.length ? (
              <ActionForm action={giveEndorsement} reset submit="Endorse" success="Endorsement published">
                <label className="block text-sm font-semibold">Student<select name="studentId" required className="mt-1.5 h-11 w-full rounded-xl border border-line bg-surface px-3">{completed.map((s) => <option key={s.id} value={s.id}>{s.user.name}</option>)}</select></label>
                <Field label="Skill" name="skill" required /><Area label="What did you see?" name="text" required minLength={10} /><Field label="Evidence link" name="evidence" type="url" required hint="Repo, demo or document that shows the work." />
              </ActionForm>) : <Empty>Complete a session with a student to unlock endorsements.</Empty>}
          </Panel>
        </>
      )}
    </>
  );
}
