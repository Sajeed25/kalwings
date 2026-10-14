import type { Role } from "@prisma/client";

/**
 * The single list of what each role can do. The sidebar, the section tabs and the workspace grid on the dashboard home all read this,
 * so a feature is named and described in exactly one place. Names are plain on purpose.
 */
export type Tab = { label: string; href: string };
export type Module = { label: string; href: string; desc: string; tabs?: Tab[] };
export type Section = { title: string; items: Module[] };

const student: Section[] = [
  { title: "Find work", items: [
    { label: "Opportunities", href: "/opportunities", desc: "Verified jobs and internships. Pay, work mode, location and eligibility are always shown." },
    { label: "Challenges", href: "/challenges", desc: "Real tasks set by employers, scored by a person against a published rubric." },
    { label: "Campus drives", href: "/dashboard/drives", desc: "Placement drives your college has opened to you." },
    { label: "Saved roles", href: "/dashboard/saved", desc: "Roles you bookmarked to come back to." },
  ] },
  { title: "Applications", items: [
    { label: "Applications", href: "/dashboard/applications", desc: "Where each application stands, offers to answer, and messages from employers.", tabs: [
      { label: "Roles", href: "/dashboard/applications" }, { label: "Interviews", href: "/dashboard/interviews" },
      { label: "Challenge submissions", href: "/dashboard/submissions" }, { label: "Assessments", href: "/dashboard/assessments" },
    ] },
  ] },
  { title: "Profile", items: [
    { label: "Profile", href: "/dashboard/profile", desc: "Your details, projects and verified skills, and the public page employers see. You decide who can see your contact details.", tabs: [
      { label: "Details", href: "/dashboard/profile" }, { label: "Projects", href: "/dashboard/portfolio" }, { label: "Public profile", href: "/dashboard/passport" },
    ] },
  ] },
  { title: "Grow", items: [
    { label: "Career copilot", href: "/dashboard/copilot", desc: "Explains how well you match a role, reviews your profile and checks what is missing." },
    { label: "Mentor sessions", href: "/dashboard/mentoring", desc: "Book and track one-to-one sessions with verified mentors." },
    { label: "Community", href: "/community", desc: "Groups, discussions and teammates for projects." },
  ] },
];

const employer: Section[] = [
  { title: "Company", items: [
    { label: "Company", href: "/dashboard/company", desc: "Verification, team, plan limits, career page and embed, message templates and stage names." },
  ] },
  { title: "Hiring", items: [
    { label: "Roles", href: "/dashboard/roles", desc: "Post jobs and internships, share them, and run challenges and assessments.", tabs: [
      { label: "Roles", href: "/dashboard/roles" }, { label: "Challenges", href: "/dashboard/challenges" },
      { label: "Assessments", href: "/dashboard/assessments" }, { label: "Description check", href: "/dashboard/jd-check" },
    ] },
  ] },
  { title: "Candidates", items: [
    { label: "Talent search", href: "/dashboard/talent", desc: "Search verified skills and projects, with a match explanation for each listing." },
    { label: "Pipeline", href: "/dashboard/pipeline", desc: "Move candidates through stages, with scorecards, notes, offers, bulk actions and tags.", tabs: [
      { label: "Pipeline", href: "/dashboard/pipeline" }, { label: "Interviews", href: "/dashboard/interviews" },
    ] },
    { label: "Analytics", href: "/dashboard/analytics", desc: "Funnel, speed to hire and where candidates come from, from your real pipeline." },
  ] },
  { title: "Campus", items: [
    { label: "Campus drives", href: "/dashboard/drives", desc: "Run drives with partner colleges and invite eligible students with their consent." },
  ] },
];

const mentor: Section[] = [
  { title: "Mentoring", items: [
    { label: "Mentor profile", href: "/dashboard/mentoring", desc: "Your profile, availability and session requests." },
    { label: "Community", href: "/community", desc: "Groups and discussions." },
  ] },
];

const college: Section[] = [
  { title: "Placements", items: [
    { label: "College", href: "/dashboard/college", desc: "Departments, student progress for those who share it, and reports." },
    { label: "Placement drives", href: "/dashboard/drives", desc: "Create drives, set eligibility and invite students." },
  ] },
];

const admin: Section[] = [
  { title: "Reviews", items: [
    { label: "Listing moderation", href: "/dashboard/moderation", desc: "Approve or reject new listings." },
    { label: "Profile verification", href: "/dashboard/credentials", desc: "Verify credentials students submit." },
    { label: "Employer plans", href: "/dashboard/plans", desc: "Assign plans and view usage." },
    { label: "Abuse reports", href: "/dashboard/reports", desc: "Reports from users about listings, profiles or posts." },
  ] },
  { title: "Platform", items: [
    { label: "Insights", href: "/dashboard/insights", desc: "Platform-wide counts and trends." },
    { label: "Users", href: "/dashboard/users", desc: "Find, suspend or restore accounts." },
    { label: "Contact inbox", href: "/dashboard/inbox", desc: "Messages from the contact form." },
  ] },
  { title: "Operations", items: [
    { label: "Audit log", href: "/dashboard/audit", desc: "Who did what, and when." },
    { label: "Server errors", href: "/dashboard/errors", desc: "Errors recorded by the server." },
  ] },
];

export const MODULES: Record<Role, Section[]> = { STUDENT: student, EMPLOYER: employer, MENTOR: mentor, COLLEGE_ADMIN: college, PLATFORM_ADMIN: admin };

/** Every module that has tabs, for the tab bar. */
export const tabGroups = (role: Role): Tab[][] => MODULES[role].flatMap((s) => s.items).filter((m) => m.tabs).map((m) => m.tabs!);
