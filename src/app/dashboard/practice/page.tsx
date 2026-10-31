import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/session";
import { PageTitle, Panel, fmt } from "@/components/dash/ui";
import { TESTS } from "@/lib/practice-bank";

export default async function Page() {
  const u = await requirePageRole("STUDENT");
  const attempts = await db.practiceAttempt.findMany({ where: { userId: u.id }, orderBy: { createdAt: "desc" }, take: 200 });
  return (
    <>
      <PageTitle title="Practice tests" sub="Short multiple-choice tests to warm up before challenges and interviews. Retake them as often as you like. Scores are private to you: no certificates, no rankings, and employers never see them." />
      <div className="grid gap-4 md:grid-cols-2">
        {TESTS.map((t) => {
          const mine = attempts.filter((a) => a.testSlug === t.slug);
          const best = mine.reduce((m, a) => Math.max(m, a.score), 0);
          return (
            <Panel key={t.slug} title={t.title}>
              <p className="-mt-2 text-sm text-ink-soft">{t.topic} · {t.questions.length} questions</p>
              <p className="mt-2 text-sm">{t.blurb}</p>
              <p className="mt-2 text-sm text-ink-soft">{mine.length ? `Best ${best}/${t.questions.length} · ${mine.length} attempt${mine.length === 1 ? "" : "s"} · last ${fmt(mine[0].createdAt)}` : "Not taken yet"}</p>
              <Link href={`/dashboard/practice/${t.slug}`} className="mt-3 inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-bold text-on-primary">{mine.length ? "Take it again" : "Start"}</Link>
            </Panel>
          );
        })}
      </div>
    </>
  );
}
