import type { Metadata } from "next";
import Link from "next/link";
import { Prose } from "@/components/pages/shell";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = { title: "Trust & Safety", description: "The rules Kalwings enforces so students and employers can trust what they see, and how to report a problem." };
const H = "font-display font-bold";

export default function Page() {
  const mail = <a className="text-accent underline" href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>;
  return (
    <Prose>
      <h1 className="text-4xl font-semibold md:text-5xl">Trust &amp; Safety</h1>
      <p>Last updated {LEGAL.updated}. These are the rules built into the product, not just promises.</p>

      <h2 className={H}>Evidence, not claims</h2>
      <ul>
        <li>Skills and credentials are always labelled: <b>self-declared</b>, <b>external certificate (not verified by Kalwings)</b>, <b>evidence-backed</b> (tied to a challenge or mentor endorsement, with the reason shown), or <b>verified by Kalwings</b>.</li>
        <li>Only our administrators can mark a Passport entry as verified, after opening the evidence link. Nothing is verified automatically.</li>
        <li>We never show invented statistics, awards, testimonials or logos. Sample content is labelled.</li>
      </ul>

      <h2 className={H}>Honest opportunities</h2>
      <ul>
        <li>Every listing shows pay, work mode, location and eligibility. Unpaid roles are labelled. Sponsored placements are labelled and never styled as verified.</li>
        <li>Companies are reviewed before they can post or search talent, and listings are moderated before going live.</li>
        <li>Asking candidates to pay any fee, promising guaranteed jobs, or moving people to private chat apps is not allowed and results in removal.</li>
        <li>We never promise jobs, interviews or outcomes.</li>
      </ul>

      <h2 className={H}>Your privacy and control</h2>
      <ul>
        <li>Your email is private by default and never shown on a Talent Passport, college roster or report.</li>
        <li>You choose who sees your Passport and each section of it. College sharing and drive participation are opt-in and reversible.</li>
        <li>Matching and assessment scores are advisory. Nobody is automatically rejected by a score.</li>
      </ul>

      <h2 className={H}>Safe community</h2>
      <ul>
        <li>Posting is limited to students and mentors in groups they have joined. The feed is newest-first with no likes or ranking.</li>
        <li>Report any post, comment, listing or profile; block anyone; group moderators and our team can hide content and remove people. Sensitive actions are logged.</li>
      </ul>

      <h2 className={H}>Report a problem</h2>
      <p>Use the <b>Report</b> link on a listing, post or comment, or email {mail} with the link and what is wrong. For privacy requests see the <Link className="text-accent underline" href="/privacy">Privacy Policy</Link>; for the rules of use see the <Link className="text-accent underline" href="/terms">Terms of Use</Link>.</p>
    </Prose>
  );
}
