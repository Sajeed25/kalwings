import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/session";
import { emailConfigured } from "@/lib/email";
import { getSettings } from "@/lib/settings";
import { PageTitle, Panel } from "@/components/dash/ui";

type Check = { label: string; done: boolean; detail: string; href?: string; fix?: string };

/** What still needs doing before and after going live. Every line is read from the real database or environment; nothing is estimated. */
export default async function Page() {
  await requirePageRole("PLATFORM_ADMIN");
  const now = new Date();
  const [admins, companies, colleges, mentors, plans, live, pCompanies, pColleges, pMentors, pListings, samples, settings, totalListings, rejectedListings, unverifiedCo, expired, closed] = await Promise.all([
    db.user.count({ where: { role: "PLATFORM_ADMIN", suspendedAt: null, email: { not: { endsWith: "@sample.kalwings.test" } } } }),
    db.company.count({ where: { status: "VERIFIED", isSample: false } }),
    db.college.count({ where: { status: "VERIFIED", NOT: { name: { startsWith: "Sample " } } } }),
    db.mentorProfile.count({ where: { status: "VERIFIED", isSample: false } }),
    db.planConfig.count({ where: { active: true } }),
    db.opportunity.count({ where: { moderated: "VERIFIED", closedAt: null, deadline: { gt: now }, company: { status: "VERIFIED", isSample: false } } }),
    db.company.count({ where: { status: "PENDING" } }),
    db.college.count({ where: { status: "PENDING" } }),
    db.mentorProfile.count({ where: { status: "PENDING" } }),
    db.opportunity.count({ where: { moderated: "PENDING" } }),
    db.company.count({ where: { isSample: true } }),
    getSettings(),
    db.opportunity.count(),
    db.opportunity.count({ where: { moderated: "REJECTED" } }),
    db.opportunity.count({ where: { moderated: "VERIFIED", company: { status: { not: "VERIFIED" } } } }),
    db.opportunity.count({ where: { moderated: "VERIFIED", closedAt: null, deadline: { lte: now }, company: { status: "VERIFIED" } } }),
    db.opportunity.count({ where: { moderated: "VERIFIED", closedAt: { not: null }, company: { status: "VERIFIED" } } }),
  ]);
  const checks: Check[] = [
    { label: "A real platform admin exists", done: admins > 0, detail: admins ? `${admins} admin${admins === 1 ? "" : "s"}.` : "Set ADMIN_EMAILS on the server and sign in with that email.", href: "/dashboard/users", fix: "Users" },
    { label: "Sign-in emails can be sent", done: emailConfigured(), detail: emailConfigured() ? "SMTP is configured." : "No SMTP settings found, so one-time codes cannot be emailed. Set the SMTP variables on the server." },
    { label: "Google sign-in (optional)", done: !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET, detail: process.env.GOOGLE_CLIENT_ID ? "Configured." : "Not configured. Email sign-in still works." },
    { label: "Employer plans are set", done: plans > 0, detail: `${plans} active plan${plans === 1 ? "" : "s"}. Check names and prices.`, href: "/dashboard/plans", fix: "Plans" },
    { label: "Support email is set", done: !!settings.supportEmail, detail: settings.supportEmail || "Shown on help and contact pages.", href: "/dashboard/site", fix: "Site settings" },
    { label: "Real companies added", done: companies > 0, detail: companies ? `${companies} verified.` : "Add companies one by one or by bulk upload.", href: "/dashboard/companies", fix: "Companies" },
    { label: "Real colleges added", done: colleges > 0, detail: colleges ? `${colleges} verified.` : "Students pick their college from this list.", href: "/dashboard/colleges", fix: "Colleges" },
    { label: "Real mentors added", done: mentors > 0, detail: mentors ? `${mentors} verified.` : "Only add people who agreed to be listed.", href: "/dashboard/mentors", fix: "Mentors" },
    { label: "Live listings for students", done: live > 0, detail: live ? `${live} open listing${live === 1 ? "" : "s"} from verified companies.` : "Post real, agreed roles with pay, mode, location and eligibility.", href: "/dashboard/companies", fix: "Companies" },
    { label: "Review queue is empty", done: pCompanies + pColleges + pMentors + pListings === 0, detail: `${pCompanies} companies, ${pColleges} colleges, ${pMentors} mentors, ${pListings} listings waiting.`, href: pListings ? "/dashboard/moderation" : "/dashboard/companies", fix: "Review" },
    { label: "No sample records left", done: samples === 0, detail: samples ? "Sample companies are still in the database. Remove them on the server with npm run db:unseed." : "Only real records are present." },
  ];
  const todo = checks.filter((c) => !c.done).length;
  return (
    <>
      <PageTitle title="Launch readiness" sub={todo ? `${todo} thing${todo === 1 ? "" : "s"} still to look at. Everything here is read live from your database and server settings.` : "Everything on the list is in place."} />
      <Panel>
        <ul className="divide-y divide-line">{checks.map((c) => (
          <li key={c.label} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div><p className="font-semibold"><span aria-hidden>{c.done ? "✓ " : "○ "}</span>{c.label}<span className="sr-only">{c.done ? " (done)" : " (to do)"}</span></p><p className="text-sm text-ink-soft">{c.detail}</p></div>
            {c.href && !c.done && <Link href={c.href} className="text-sm font-semibold text-accent underline-offset-2 hover:underline">{c.fix} →</Link>}
          </li>))}</ul>
      </Panel>
      <Panel title="Why students may see no opportunities" className="mt-6">
        <p className="mb-3 text-sm text-ink-soft">The public list shows a listing only when it is approved, its company is verified, it is not closed and its deadline has not passed. Here is where every listing is right now:</p>
        <ul className="divide-y divide-line text-sm">
          {([
            ["Visible to the public now", live, "/opportunities", "View the public page"],
            ["Waiting for your approval", pListings, "/dashboard/moderation", "Review listings"],
            ["Approved, but the company is not verified", unverifiedCo, "/dashboard/companies?status=PENDING", "Verify companies"],
            ["Approved, but the deadline has passed", expired, "/dashboard/companies", "Open a company to reopen or repost"],
            ["Closed by the employer or an admin", closed, "/dashboard/companies", "Open a company"],
            ["Rejected", rejectedListings, "/dashboard/moderation", "Review"],
          ] as [string, number, string, string][]).map(([label, n, href, cta]) => (
            <li key={label} className="flex flex-wrap items-center justify-between gap-3 py-2.5"><span><b>{n}</b> {label}</span>{n > 0 && <Link href={href} className="font-semibold text-accent underline-offset-2 hover:underline">{cta} →</Link>}</li>
          ))}
        </ul>
        {totalListings === 0 && <p className="mt-3 rounded-xl border border-dashed border-line p-3 text-sm">There are no listings at all yet. Add the first one: <Link href="/dashboard/companies" className="font-semibold text-accent underline">Companies</Link> → open a verified company → “Post a listing for this company” (it goes live at once), or ask an employer to post and approve it in Listing moderation.</p>}
      </Panel>
    </>
  );
}
