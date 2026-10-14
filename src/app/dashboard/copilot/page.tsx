import Link from "next/link";
import { db } from "@/lib/db";
import { asList } from "@/lib/lists";
import { requirePageRole } from "@/lib/session";
import { Empty, PageTitle, Panel, fmt } from "@/components/dash/ui";
import { Badge } from "@/components/ui/badge";
import { closeGapTip, explainMatch } from "@/lib/matching";
import { profileFeedback } from "@/lib/feedback";
import { interviewPrompts } from "@/lib/prep";
import { TYPE_LABEL } from "@/lib/opportunity-types";

export default async function Page({ searchParams }: { searchParams: Promise<{ listing?: string }> }) {
  const listingId = (await searchParams).listing;
  const u = await requirePageRole("STUDENT");
  const sp = await db.studentProfile.findUniqueOrThrow({ where: { userId: u.id }, include: { projects: true, skills: true, entries: { select: { id: true } }, applications: { select: { opportunityId: true } } } });
  const applied = new Set(sp.applications.map((a) => a.opportunityId));
  const open = await db.opportunity.findMany({
    where: { moderated: "VERIFIED", closedAt: null, deadline: { gt: new Date() }, company: { status: "VERIFIED", members: { none: { user: { suspendedAt: { not: null } } } } } },
    include: { company: true }, orderBy: { createdAt: "desc" }, take: 200,
  });
  const student = { verified: sp.skills.map((s) => s.skill), claimed: asList(sp.skillsClaimed), graduationYear: sp.graduationYear };
  const ranked = open.filter((o) => !applied.has(o.id)).map((o) => ({ o, m: explainMatch({ wantedSkills: asList(o.skills), gradYears: asList(o.gradYears), student }) }))
    .filter((x) => x.m.score !== null && x.m.yearFit !== "does-not-fit").sort((a, b) => (b.m.score ?? 0) - (a.m.score ?? 0)).slice(0, 8);
  const feedback = profileFeedback(sp, { projects: sp.projects, evidence: sp.skills.length, entries: sp.entries.length });
  const focus = listingId ? open.find((o) => o.id === listingId) ?? null : null;
  const card = (o: (typeof open)[number], m: ReturnType<typeof explainMatch>) => {
    const prompts = interviewPrompts(asList(o.skills));
    return (
      <div className="rounded-xl border border-line p-4">
        <div className="flex flex-wrap items-start justify-between gap-2"><div>
          <Link className="font-semibold underline" href={o.type === "CHALLENGE" ? `/challenges/${o.id}` : `/opportunities/${o.id}`}>{o.title}</Link>
          <p className="text-sm text-ink-soft">{o.company.name} · {TYPE_LABEL[o.type]} · {o.payText} · apply by {fmt(o.deadline)}</p></div>
          {m.score !== null && <Badge tone="accent" title="Advisory indicator only">Match {m.score}/100</Badge>}</div>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">{m.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
        {m.missing.length > 0 && <details className="mt-3 text-sm"><summary className="cursor-pointer font-semibold">How to close the gap</summary><ul className="mt-2 list-disc space-y-1 pl-5 text-ink-soft">{m.missing.map((s) => <li key={s}><b>{s}:</b> {closeGapTip(s)}</li>)}</ul></details>}
        <details className="mt-2 text-sm"><summary className="cursor-pointer font-semibold">Practice questions</summary>
          <p className="mt-2 text-xs text-ink-soft">Fixed practice prompts, not predictions of what this employer will ask.</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">{prompts.general.slice(0, 3).map((q) => <li key={q}>{q}</li>)}</ul>
          {prompts.bySkill.map((s) => <div key={s.skill} className="mt-2"><p className="font-semibold">{s.skill}</p><ul className="list-disc space-y-1 pl-5">{s.prompts.map((q) => <li key={q}>{q}</li>)}</ul></div>)}
        </details>
      </div>
    );
  };
  const tone = { "do-first": "accent", "worth-doing": "spot", good: "neutral" } as const;
  return (
    <>
      <PageTitle title="Career copilot" sub="Transparent suggestions based only on what is on your profile. No hidden scoring, nothing is invented, and nothing here decides your chances." />
      {listingId && <Panel title="How your profile lines up with this listing" className="mb-6">{focus ? card(focus, explainMatch({ wantedSkills: asList(focus.skills), gradYears: asList(focus.gradYears), student })) : <Empty>That listing isn&apos;t open any more.</Empty>}</Panel>}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Panel title="Recommended for you">
          <p className="mb-4 text-sm text-ink-soft">Each match shows why it was suggested and what is missing. The score is a rough indicator, not a prediction. Listings that target a different graduation year are left out.</p>
          {ranked.length ? <ul className="space-y-4">{ranked.map(({ o, m }) => <li key={o.id}>{card(o, m)}</li>)}</ul> : <Empty>No open listings match yet. Add skills to your profile or check back as employers post.</Empty>}
        </Panel>
        <Panel title="Profile review">
          <ul className="space-y-3 text-sm">{feedback.map((f, i) => <li key={i} className="flex gap-2"><Badge tone={tone[f.level]} className="h-fit shrink-0">{f.level === "do-first" ? "Do first" : f.level === "worth-doing" ? "Worth doing" : "Good"}</Badge><span>{f.text}</span></li>)}</ul>
          <p className="mt-4 text-xs text-ink-soft">Rule-based checks of your own profile. Edit it under <Link className="underline" href="/dashboard/profile">Profile</Link> and <Link className="underline" href="/dashboard/passport">Talent Passport</Link>.</p>
        </Panel>
      </div>
    </>
  );
}
