import { requirePageRole } from "@/lib/session";
import { PageTitle } from "@/components/dash/ui";
import { BulkUpload } from "@/components/dash/bulk-upload";
import { SPECS, BULK_MAX_ROWS } from "@/lib/bulk";

export default async function Page() {
  await requirePageRole("PLATFORM_ADMIN");
  return (
    <>
      <PageTitle title="Bulk upload" sub={`Add many students, companies or mentors at once from an Excel (.xlsx) or CSV file, up to ${BULK_MAX_ROWS} rows each. Download the template, fill it in, then preview: nothing is saved until you press Import. Rows that already exist are skipped, and one bad row never stops the others. Every import is logged.`} />
      <div className="space-y-6">
        <BulkUpload kind="students" title="Students" help={SPECS.students.help} columns={SPECS.students.columns} />
        <BulkUpload kind="companies" title="Companies" help={SPECS.companies.help} columns={SPECS.companies.columns} />
        <BulkUpload kind="mentors" title="Mentors" help={SPECS.mentors.help} columns={SPECS.mentors.columns} />
      </div>
    </>
  );
}
