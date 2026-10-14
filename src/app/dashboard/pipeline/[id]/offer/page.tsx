import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/session";
import { PageTitle } from "@/components/dash/ui";
import { PrintButton } from "@/components/dash/print-button";

export const dynamic = "force-dynamic";

/** A plain, printable summary of an offer that was extended in Kalwings. It is a record of the terms entered, not a legal contract. */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const u = await requirePageRole("EMPLOYER");
  const { id } = await params;
  const mem = await db.employerMember.findUnique({ where: { userId: u.id }, include: { company: true } });
  if (!mem || mem.company.status !== "VERIFIED") notFound();
  const app = await db.application.findFirst({ where: { id, opportunity: { companyId: mem.companyId }, offer: { isNot: null } }, include: { offer: true, opportunity: true, student: { include: { user: { select: { name: true } } } } } });
  if (!app?.offer) notFound();
  const o = app.offer;
  const date = (d: Date) => d.toLocaleDateString("en-IN", { dateStyle: "long", timeZone: "Asia/Kolkata" });
  return (
    <>
      <div className="print:hidden"><PageTitle title="Offer letter" sub="Review, then print or save as PDF. Edit the terms from the Pipeline if anything is wrong." /><PrintButton /></div>
      <article className="mx-auto mt-6 max-w-2xl rounded-xl border border-line bg-white p-10 text-black print:mt-0 print:max-w-none print:border-0 print:p-0">
        <p className="text-sm">{date(o.createdAt)}</p>
        <h2 className="mt-6 text-2xl font-bold">{mem.company.name}</h2>
        <p className="mt-6">Dear {app.student.user.name},</p>
        <p className="mt-4">We are pleased to offer you the position of <b>{app.opportunity.title}</b> at {mem.company.name}.</p>
        <dl className="mt-6 space-y-3">
          <div><dt className="text-sm font-semibold">Role</dt><dd>{app.opportunity.title} ({app.opportunity.location}, {app.opportunity.workMode.toLowerCase()})</dd></div>
          <div><dt className="text-sm font-semibold">Pay and key terms</dt><dd className="whitespace-pre-line">{o.summary}</dd></div>
          {o.joiningDate && <div><dt className="text-sm font-semibold">Proposed joining date</dt><dd>{date(o.joiningDate)}</dd></div>}
        </dl>
        <p className="mt-6 text-sm">Status in Kalwings: {o.status.toLowerCase()}{o.respondedAt ? ` on ${date(o.respondedAt)}` : ""}.</p>
        <p className="mt-8 text-xs text-gray-600">This letter records the terms entered by {mem.company.name} on Kalwings. Any formal employment agreement, if required, is issued separately by the employer. Kalwings is not a party to this offer.</p>
        <p className="mt-10">Sincerely,<br />{u.name}<br />{mem.company.name}</p>
      </article>
    </>
  );
}
