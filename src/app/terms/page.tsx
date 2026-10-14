import type { Metadata } from "next";
import Link from "next/link";
import { Prose } from "@/components/pages/shell";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = { title: "Terms of Use", description: "The rules for using Kalwings: accounts, acceptable use, listings, challenges, privacy of work, and our limits." };

const H = "font-display font-bold";

export default function Page() {
  const mail = <a className="text-accent underline" href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>;
  return (
    <Prose>
      <h1 className="text-4xl font-extrabold md:text-5xl">Terms of Use</h1>
      <p>Last updated {LEGAL.updated}. These terms are an agreement between you and {LEGAL.brand} (&quot;we&quot;, &quot;us&quot;), based in {LEGAL.place}, for your use of {LEGAL.site} and related services. By creating an account or using the site you agree to them and to our <Link className="text-accent underline" href="/privacy">Privacy Policy</Link>. If you do not agree, please do not use {LEGAL.brand}.</p>

      <h2 className={H}>1. What Kalwings is</h2>
      <p>{LEGAL.brand} is a platform where students and early-career professionals show evidence of their skills and where employers, colleges and mentors discover and support them. We provide tools: profiles, listings, challenges, assessments, a community, interviews and offers tracking. <b>We are not an employer, recruiter or placement agency and we are not a party to any job, internship, project or mentoring arrangement between users.</b></p>

      <h2 className={H}>2. No guarantees</h2>
      <p>{LEGAL.brand} does not guarantee jobs, interviews, offers, selection, mentoring outcomes, or the accuracy of anything users post. Match indicators, practice questions, profile reviews and assessment scores are advisory tools: they do not predict outcomes and must not be treated as a decision about anyone&apos;s ability.</p>

      <h2 className={H}>3. Eligibility and accounts</h2>
      <ul>
        <li>You must be 18 or older and able to enter a binding agreement.</li>
        <li>Give accurate information and keep it up to date. One person, one account; do not impersonate anyone.</li>
        <li>You sign in with one-time codes sent to your email or phone. Keep access to them secure; you are responsible for activity on your account. Tell us promptly if you suspect misuse.</li>
        <li>Recruiters, colleges and mentors must be who they say they are. We may require proof and may refuse or remove verification.</li>
      </ul>

      <h2 className={H}>4. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>post anything false, misleading, fraudulent, defamatory, hateful, harassing, sexually explicit, or that infringes anyone&apos;s rights;</li>
        <li>claim skills, credentials, employment, certificates or endorsements you do not have, or mark anything as verified when it is not;</li>
        <li>ask candidates to pay money (registration, training, deposit, kit or similar fees), promise guaranteed jobs, or move candidates to private channels to avoid our rules;</li>
        <li>discriminate in listings or hiring on grounds such as gender, religion, caste, disability or region, or otherwise break applicable law;</li>
        <li>scrape, copy or resell data from the platform, or contact people for purposes unrelated to the opportunity, community or session in question;</li>
        <li>upload malware, attempt to break, overload or bypass the security or rate limits, probe for other users&apos; data, or submit code designed to attack the assessment runner or other systems;</li>
        <li>use the community for spam, advertising, or unsolicited recruitment outside a listing.</li>
      </ul>

      <h2 className={H}>5. Your content</h2>
      <p>You own the content you post (profile, projects, submissions, posts). You give us a non-exclusive, worldwide licence to host, display and process it only to run and secure the service and to show it to the people you have chosen, under your visibility settings. The licence ends when you delete the content or your account, except for copies in backups for a short period and records we must keep by law. You confirm you have the right to post what you post and that it does not breach anyone else&apos;s rights or confidentiality.</p>

      <h2 className={H}>6. Employers and listings</h2>
      <ul>
        <li>Listings must truthfully state pay (or that the role is unpaid), work mode, location and eligibility. Unpaid roles are labelled as such. Sponsored placements are always labelled and are never presented as verified.</li>
        <li>New companies and listings are reviewed before they go live. Approval is not an endorsement and does not mean we have checked every claim.</li>
        <li>Plan limits (listings, challenges, assessments, team seats) apply as shown on your Company page. Plans are currently assigned by us; prices on the website may be placeholders until billing is switched on, and no charge is made without your agreement.</li>
        <li>Report suspicious listings using the Report link. We may remove listings and suspend accounts that break these terms.</li>
      </ul>

      <h2 className={H}>7. Challenges, assessments and candidate work</h2>
      <ul>
        <li>A challenge&apos;s brief, rubric and reward must be stated honestly. Submissions are reviewed by people against the published rubric.</li>
        <li><b>Candidates keep ownership of what they submit.</b> By submitting, you let the employer view and evaluate it for that challenge. Employers must not use, publish or build on a submission commercially without the candidate&apos;s written agreement, and must not use challenges to obtain free work.</li>
        <li>Awarded skills appear as evidence-backed only when a reviewer awards them and they show the reason. Only our administrators can mark a Passport entry as verified.</li>
        <li>Do not share assessment questions or answers publicly or get unauthorised help where the instructions forbid it.</li>
      </ul>

      <h2 className={H}>8. Colleges, mentors and the community</h2>
      <ul>
        <li>Colleges may see student information only for students who opted in, and must use it only for placement support. Reports must not be shared outside the institution without the students&apos; consent.</li>
        <li>Mentors give guidance in good faith; it is not professional, legal or financial advice. Endorsements must link to real evidence.</li>
        <li>Group moderators and our team may hide content and remove members. You can report and block other members.</li>
      </ul>

      <h2 className={H}>9. Suspension and ending your account</h2>
      <p>You can delete your account at any time in Dashboard → Account &amp; data. We may suspend or remove accounts, content or listings that break these terms, create risk for others, or are required to be removed by law. Where reasonable we will tell you why. You can contact {mail} to ask us to review a decision.</p>

      <h2 className={H}>10. Third-party services and links</h2>
      <p>The site links to and works with services we do not control (for example GitHub links, Google sign-in, email delivery). We are not responsible for their content or practices.</p>

      <h2 className={H}>11. Our intellectual property</h2>
      <p>The {LEGAL.brand} name, logo, design and software belong to us or our licensors. You may not copy or reuse them without permission, except as the law allows.</p>

      <h2 className={H}>12. Disclaimers and limits of liability</h2>
      <p>The service is provided &quot;as is&quot; and &quot;as available&quot;. We work to keep it reliable and secure, but we do not promise it will be uninterrupted or error-free. To the extent the law allows, we are not liable for indirect or consequential loss, loss of opportunity or income, or for anything arising from dealings between users or from content users post. Our total liability for any claim relating to the service is limited to the greater of the amount you paid us in the 12 months before the claim and ₹5,000. Nothing in these terms limits liability that cannot be limited by law.</p>

      <h2 className={H}>13. Indemnity</h2>
      <p>You agree to cover reasonable losses we suffer because of your content or because you broke these terms or the law, to the extent the law allows.</p>

      <h2 className={H}>14. Changes</h2>
      <p>We may update these terms as the service evolves. We will change the date above and, for material changes, notify you in the app or by email. Using the service after the change means you accept it.</p>

      <h2 className={H}>15. Governing law and disputes</h2>
      <p>These terms are governed by the laws of India. Courts in {LEGAL.place} have exclusive jurisdiction, subject to any mandatory rights you have where you live. Please contact us first at {mail} so we can try to resolve a problem informally.</p>

      <h2 className={H}>16. Contact</h2>
      <p>{LEGAL.brand}, {LEGAL.place}. {mail}. For privacy requests, see the <Link className="text-accent underline" href="/privacy">Privacy Policy</Link>.</p>
    </Prose>
  );
}
