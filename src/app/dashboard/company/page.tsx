import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/session";
import { ActionForm, Area, Field } from "@/components/dash/action-form";
import { PageTitle, Panel, Status } from "@/components/dash/ui";
import { createCompany } from "@/app/actions/employer";

export default async function Page() {
  const u = await requirePageRole("EMPLOYER");
  const mem = await db.employerMember.findUnique({ where: { userId: u.id }, include: { company: true } });
  return (
    <>
      <PageTitle title="Company" sub="Every company is reviewed before it can post roles or search talent." />
      {mem ? (
        <Panel><div className="flex items-center justify-between"><h2 className="text-xl">{mem.company.name}</h2><Status s={mem.company.status} /></div>
          <p className="mt-2 text-sm text-ink-soft">{mem.company.website}</p>{mem.company.about && <p className="mt-2">{mem.company.about}</p>}
          <p className="mt-4 text-sm text-ink-soft">{mem.company.status === "PENDING" ? "We'll notify you once the review is done." : mem.company.status === "VERIFIED" ? "You can post roles and search talent." : "This company was not approved. Contact support to appeal."}</p></Panel>
      ) : (
        <Panel><ActionForm action={createCompany} submit="Submit for verification" success="Submitted"><Field label="Company name" name="name" required /><Field label="Website" name="website" type="url" required hint="We use this to verify the company." /><Area label="About" name="about" /></ActionForm></Panel>
      )}
    </>
  );
}
