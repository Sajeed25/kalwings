import { notFound } from "next/navigation";
import { requirePageRole } from "@/lib/session";
import { PageTitle, Panel } from "@/components/dash/ui";
import { PracticeRunner } from "@/components/practice-runner";
import { forTaking, testBySlug } from "@/lib/practice-bank";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  await requirePageRole("STUDENT");
  const t = testBySlug((await params).slug);
  if (!t) notFound();
  return (
    <>
      <PageTitle title={t.title} sub={`${t.questions.length} questions. Pick one answer for each, then submit to see the right answers and why.`} />
      <Panel><PracticeRunner test={forTaking(t)} /></Panel>
    </>
  );
}
