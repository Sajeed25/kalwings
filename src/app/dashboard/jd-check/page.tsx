import { requirePageRole } from "@/lib/session";
import { PageTitle, Panel } from "@/components/dash/ui";
import { JdChecker } from "@/components/dash/jd-checker";

export default async function Page() {
  await requirePageRole("EMPLOYER");
  return (
    <>
      <PageTitle title="Job description check" sub="Catch things that put candidates off or break Kalwings rules before you post. Rule-based, runs in your browser, and the text isn't stored or sent anywhere." />
      <Panel><JdChecker /></Panel>
    </>
  );
}
