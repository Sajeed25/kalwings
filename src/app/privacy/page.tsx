import type { Metadata } from "next";
import Link from "next/link";
import { Prose } from "@/components/pages/shell";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = { title: "Privacy Policy", description: "What Kalwings collects, why, who sees it, how long we keep it, and how to access, export or delete your data." };

const H = "font-display font-bold";

export default function Page() {
  const mail = <a className="text-accent underline" href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>;
  return (
    <Prose>
      <h1 className="text-4xl font-semibold md:text-5xl">Privacy Policy</h1>
      <p>Last updated {LEGAL.updated}. This explains how {LEGAL.brand} (&quot;we&quot;, &quot;us&quot;), based in {LEGAL.place}, handles personal data on {LEGAL.site}. We follow the principles of India&apos;s Digital Personal Data Protection Act, 2023. Questions or requests: {mail}.</p>
      <p>The short version: we collect what we need to run the platform, your contact details stay private unless you choose otherwise, you decide who sees each part of your profile, we don&apos;t sell your data, and you can export or delete your account yourself.</p>

      <h2 className={H}>1. Who this applies to</h2>
      <p>Students and job seekers, mentors, recruiters and companies, college coordinators, and visitors to the site. {LEGAL.brand} is for people aged 18 and over. If you believe someone under 18 has an account, contact us and we will remove it.</p>

      <h2 className={H}>2. What we collect</h2>
      <ul>
        <li><b>Account:</b> your name and email address (used to sign you in), and your role. If you choose to turn on password login, we store only a salted one-way hash of your password, never the password itself.</li>
        <li><b>Profile and Talent Passport (students):</b> headline, bio, city, graduation year, college and department, skills, links such as GitHub, what you are looking for, projects, photos and screenshots you upload, experience, achievements, hackathons and certificates, and any evidence links you give us.</li>
        <li><b>Activity:</b> applications and their status, messages with employers, interviews and offers, challenge submissions, assessment answers and code, mentor session requests, community posts and comments, reports you file, and notifications.</li>
        <li><b>Organisations:</b> company or college name, website, team members, plan, and drive details. Mentors: role, company, country and domain.</li>
        <li><b>Technical:</b> your IP address and request timing (kept briefly to stop abuse such as repeated sign-in attempts), error logs without personal content, and an audit log of actions taken by administrators and verified users on sensitive features.</li>
      </ul>
      <p>We do not collect your contact details for display, payment card details (there are no online payments yet), government ID numbers, or precise location.</p>

      <h2 className={H}>3. Why we use it</h2>
      <ul>
        <li>To create and run your account, sign you in, and show your profile where you choose.</li>
        <li>To match you with opportunities and explain why a listing may or may not fit (computed on our servers from your own profile; no external AI service is used).</li>
        <li>To let employers, mentors and colleges do what you ask of them: review an application, run a challenge, host a drive, give an endorsement.</li>
        <li>To send service emails: sign-in codes and notifications about applications, interviews, offers, messages and sessions. You can switch off notification emails in one click; sign-in codes are always sent because you need them to log in.</li>
        <li>To keep the platform safe: verify companies, colleges and credentials, moderate listings and community content, investigate reports, and prevent fraud and abuse.</li>
        <li>To maintain and improve the service and to meet legal obligations.</li>
      </ul>

      <h2 className={H}>4. Who can see what</h2>
      <ul>
        <li><b>Your email is private by default.</b> Employers see them only if you switch on &quot;share my contact details&quot; in Profile. They never appear on your Talent Passport, college rosters or reports.</li>
        <li><b>Talent Passport:</b> you choose, for the whole Passport and separately for projects, endorsements and experience entries, whether it is visible to anyone with the link, only to verified recruiters, or only to you. Private and suspended profiles are excluded from recruiter search. Passport pages ask search engines not to index them.</li>
        <li><b>Employers</b> you apply to see your application, your Passport (subject to your settings) and the messages in that application. Employers who invite you to a challenge or assessment see your submission for it.</li>
        <li><b>Your college</b> sees your name, headline, department and progress only if you chose that college and ticked the sharing box. You can withdraw at any time and you disappear from its roster and future reports.</li>
        <li><b>Campus drives:</b> accepting a drive invitation shares your name, headline, department and Passport link with that company for that drive only.</li>
        <li><b>Community:</b> posts and comments are visible to signed-in members of the relevant group. College communities are visible only to members of that college. You can report content and block other members.</li>
        <li><b>Mentors</b> see what you write in a session request and, if you complete a session, may endorse your work with a link as evidence.</li>
        <li><b>Kalwings staff and moderators</b> can access data needed to verify, moderate and support the platform. Administrative actions are logged.</li>
      </ul>

      <h2 className={H}>5. Service providers</h2>
      <p>We do not sell personal data and we do not run third-party advertising or analytics trackers. We use a small number of providers to operate the service:</p>
      <ul>
        <li><b>Hostinger</b> for hosting, the database and email delivery (data and the email address and message content of sign-in and notification emails pass through their infrastructure).</li>
        <li><b>Google</b>, only if you choose &quot;Continue with Google&quot;: we receive your name and email from Google to sign you in.</li>
        <li><b>A code-execution service</b>, only for coding assessments and only when enabled: the code you submit is sent to an isolated runner to be tested.</li>
      </ul>
      <p>We may disclose data when required by law or to protect people from harm or fraud.</p>

      <h2 className={H}>6. Cookies and similar storage</h2>
      <ul>
        <li>A signed, <code>httpOnly</code> session cookie keeps you signed in, plus a small non-sensitive cookie that tells the site you are signed in.</li>
        <li>Your light/dark theme choice is saved in your browser&apos;s local storage.</li>
        <li>An offline page and static files are cached by the app&apos;s service worker; private pages are never cached.</li>
      </ul>
      <p>We do not use advertising or cross-site tracking cookies.</p>

      <h2 className={H}>7. How long we keep data</h2>
      <ul>
        <li>Your account and profile are kept until you delete your account (Dashboard → Account &amp; data) or ask us to.</li>
        <li>Deleting your account removes your profile, applications, messages, uploads, submissions and community content. Some records may remain where the law requires it, or in an anonymised form, for example an administrator&apos;s audit entry.</li>
        <li>Sign-in codes expire in 10 minutes. Rate-limit records and error logs are short-lived technical records that we clear periodically.</li>
        <li>Database backups are kept for about 14 days, so deleted data can persist in backups for up to that long before they are overwritten.</li>
      </ul>

      <h2 className={H}>8. Your rights and choices</h2>
      <p>You can, at any time:</p>
      <ul>
        <li><b>Access and export</b> your data: Dashboard → Account &amp; data → download.</li>
        <li><b>Correct</b> your information in Profile and your Passport.</li>
        <li><b>Delete</b> your account yourself in Account &amp; data.</li>
        <li><b>Control visibility</b> in Passport settings, contact sharing in Profile, college sharing in Profile, and email notifications in Notifications.</li>
        <li><b>Withdraw consent</b> for anything based on consent (for example college sharing) without affecting the rest of your account.</li>
        <li><b>Nominate someone</b> to exercise your rights if you cannot, as provided by the DPDP Act.</li>
      </ul>
      <p>If you cannot use the tools above, or want to complain, email {mail}. We aim to reply within 7 days and to resolve requests within 30 days. If you are not satisfied you may approach the Data Protection Board of India as provided by law.</p>

      <h2 className={H}>9. Security</h2>
      <p>We use encrypted connections, signed session cookies, one-time sign-in codes and optional passwords stored only as salted hashes, rate limits on sign-in attempts, server-side permission checks on every action, rate limiting, restricted uploads, and an audit log for sensitive actions. No system is perfectly secure. If a breach affects your data we will notify you and the authorities as the law requires.</p>

      <h2 className={H}>10. Where data is processed</h2>
      <p>Our providers may process data in India or other countries. By using the service you understand your data may be transferred as needed to operate it, under the protections described here.</p>

      <h2 className={H}>11. Changes</h2>
      <p>If we make material changes we will update the date above and notify signed-in users in the app or by email. Please also read our <Link className="text-accent underline" href="/terms">Terms of Use</Link> and <Link className="text-accent underline" href="/trust">Trust &amp; Safety</Link> page.</p>

      <h2 className={H}>12. Contact</h2>
      <p>{LEGAL.brand}, {LEGAL.place}. Privacy and grievance contact: {mail}.</p>
    </Prose>
  );
}
