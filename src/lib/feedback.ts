import { asList } from "@/lib/lists";

export type FeedbackItem = { level: "do-first" | "worth-doing" | "good"; text: string };
type P = { headline: string | null; bio: string | null; city: string | null; githubUrl: string | null; graduationYear: number | null; skillsClaimed: unknown; lookingFor: string | null };

/** Rule-based profile review. It checks what is on the profile and says what to improve; it never adds or invents anything. */
export function profileFeedback(p: P, ctx: { projects: { title: string; summary: string; githubUrl: string | null; demoUrl: string | null; imageId: string | null }[]; evidence: number; entries: number }): FeedbackItem[] {
  const out: FeedbackItem[] = [];
  const add = (level: FeedbackItem["level"], text: string) => out.push({ level, text });
  const skills = asList(p.skillsClaimed as never);
  if (!p.headline || p.headline.length < 15) add("do-first", "Make your headline specific: what you study or build and what you are looking for (e.g. “ECE final-year, embedded and IoT, seeking internships”).");
  else add("good", "Your headline is specific.");
  if ((p.bio?.length ?? 0) < 60) add("do-first", "Write a short bio (2 to 3 sentences) about what you have built and what you want to do next.");
  if (skills.length < 3) add("do-first", "List at least 3 skills you can really demonstrate. Employers search on these.");
  else if (skills.length > 12) add("worth-doing", "You list many skills. Keep the ones you can show in a project; a shorter, honest list reads better.");
  if (!ctx.projects.length) add("do-first", "Add at least one project with a link. Projects are the strongest evidence a fresher can show.");
  for (const x of ctx.projects) {
    if (!x.githubUrl && !x.demoUrl) add("worth-doing", `“${x.title}” has no code or demo link. Add one so a reviewer can check it.`);
    else if (!x.imageId) add("worth-doing", `Add a screenshot or photo to “${x.title}”.`);
    if (x.summary.length < 60) add("worth-doing", `Explain “${x.title}” in more detail: the problem, what you did and the result.`);
  }
  if (!p.githubUrl) add("worth-doing", "Link your GitHub (or another place your work lives).");
  if (!ctx.evidence) add("worth-doing", "No evidence-backed skills yet. Complete a challenge or ask a mentor to endorse a project, with a link as evidence.");
  else add("good", `You have ${ctx.evidence} evidence-backed skill${ctx.evidence === 1 ? "" : "s"}.`);
  if (!p.graduationYear) add("do-first", "Add your graduation year: many listings are limited by it.");
  if (!p.city) add("worth-doing", "Add your city so location filters work for you.");
  if (!p.lookingFor) add("worth-doing", "Say what you are looking for (internship, job, project work).");
  if (!ctx.entries) add("worth-doing", "Add experience, hackathons or certificates to your Passport if you have them. Mark nothing you can't back up.");
  return out;
}
