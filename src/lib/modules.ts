import type { Role } from "@prisma/client";

/**
 * The single list of what each role can do. The sidebar, the section tabs and the workspace grid on the dashboard home all read this,
 * so a feature is named and described in exactly one place. Names are plain on purpose.
 */
export type Tab = { label: string; href: string };
export type IconKey = "briefcase" | "trophy" | "school" | "bookmark" | "clipboard" | "user" | "sparkles" | "users" | "chat" | "building" | "search" | "chart" | "board" | "calendar" | "shield" | "badge" | "card" | "flag" | "inbox" | "log" | "alert" | "file";
export type Module = { label: string; href: string; desc: string; icon: IconKey; tabs?: Tab[] };
export type Section = { title: string; items: Module[] };

const student: Section[] = [
  { title: "Find work", items: [
    { label: "Opportunities", icon: "briefcase", href: "/opportunities", desc: "Verified jobs and internships. Pay, work mode, location and eligibility are always shown." },
    { label: "Challenges", icon: "trophy", href: "/challenges", desc: "Real tasks set by employers, scored by a person against a published rubric." },
    { label: "Campus drives", icon: "school", href: "/dashboard/drives", desc: "Placement drives your college has opened to you." },
    { label: "Events", icon: "calendar", href: "/events", desc: "Webinars, workshops, hackathons and meetups from verified colleges, employers and mentors." },
    { label: "Saved roles", icon: "bookmark", href: "/dashboard/saved", desc: "Roles you bookmarked to come back to." },
  ] },
  { title: "Applications", items: [
    { label: "Applications", icon: "clipboard", href: "/dashboard/applications", desc: "Where each application stands, offers to answer, and messages from employers.", tabs: [
      { label: "Roles", href: "/dashboard/applications" }, { label: "Interviews", href: "/dashboard/interviews" },
      { label: "Challenge submissions", href: "/dashboard/submissions" }, { label: "Assessments", href: "/dashboard/assessments" },
    ] },
  ] },
  { title: "Profile", items: [
    { label: "Profile", icon: "user", href: "/dashboard/profile", desc: "Your details, projects and verified skills, and the public page employers see. You decide who can see your contact details.", tabs: [
      { label: "Details", href: "/dashboard/profile" }, { label: "Projects", href: "/dashboard/portfolio" }, { label: "Public profile", href: "/dashboard/passport" }, { label: "Resume & video", href: "/dashboard/resume" },
    ] },
  ] },
  { title: "Grow", items: [
    { label: "Job alerts", icon: "inbox", href: "/dashboard/alerts", desc: "Get told when a listing you care about goes live." },
    { label: "Sharing impact", icon: "sparkles", href: "/dashboard/referrals", desc: "How many friends applied through the links you shared." },
    { label: "Practice tests", icon: "clipboard", href: "/dashboard/practice", desc: "Short private quizzes in Python, SQL, JavaScript and aptitude, with the reasoning for every answer." },
    { label: "Career copilot", icon: "sparkles", href: "/dashboard/copilot", desc: "Explains how well you match a role, reviews your profile and checks what is missing." },
    { label: "Mentor sessions", icon: "users", href: "/dashboard/mentoring", desc: "Book and track one-to-one sessions with verified mentors." },
    { label: "Community", icon: "chat", href: "/community", desc: "Groups, discussions and teammates for projects." },
  ] },
];

const employer: Section[] = [
  { title: "Company", items: [
    { label: "Company", icon: "building", href: "/dashboard/company", desc: "Verification, team, plan limits, career page and embed, message templates and stage names." },
  ] },
  { title: "Hiring", items: [
    { label: "Roles", icon: "file", href: "/dashboard/roles", desc: "Post jobs and internships, share them, and run challenges and assessments.", tabs: [
      { label: "Roles", href: "/dashboard/roles" }, { label: "Challenges", href: "/dashboard/challenges" },
      { label: "Assessments", href: "/dashboard/assessments" }, { label: "Description check", href: "/dashboard/jd-check" },
    ] },
  ] },
  { title: "Candidates", items: [
    { label: "Talent search", icon: "search", href: "/dashboard/talent", desc: "Search verified skills and projects, with a match explanation for each listing." },
    { label: "Pipeline", icon: "board", href: "/dashboard/pipeline", desc: "Move candidates through stages, with scorecards, notes, offers, bulk actions and tags.", tabs: [
      { label: "Pipeline", href: "/dashboard/pipeline" }, { label: "Interviews", href: "/dashboard/interviews" },
    ] },
    { label: "Analytics", icon: "chart", href: "/dashboard/analytics", desc: "Funnel, speed to hire and where candidates come from, from your real pipeline." },
  ] },
  { title: "Campus", items: [
    { label: "Campus drives", icon: "school", href: "/dashboard/drives", desc: "Run drives with partner colleges and invite eligible students with their consent." },
    { label: "Events", icon: "calendar", href: "/dashboard/events", desc: "Post webinars, workshops and meetups for students and see who is coming." },
  ] },
];

const mentor: Section[] = [
  { title: "Mentoring", items: [
    { label: "Mentor profile", icon: "user", href: "/dashboard/mentoring", desc: "Your profile, availability and session requests." },
    { label: "Events", icon: "calendar", href: "/dashboard/events", desc: "Post webinars, workshops and meetups for students and see who is coming." },
    { label: "Community", icon: "chat", href: "/community", desc: "Groups and discussions." },
  ] },
];

const college: Section[] = [
  { title: "Placements", items: [
    { label: "College", icon: "building", href: "/dashboard/college", desc: "Departments, student progress for those who share it, and reports." },
    { label: "Placement drives", icon: "calendar", href: "/dashboard/drives", desc: "Create drives, set eligibility and invite students." },
    { label: "Events", icon: "calendar", href: "/dashboard/events", desc: "Post webinars, workshops and meetups for students and see who is coming." },
  ] },
];

const admin: Section[] = [
  { title: "Reviews", items: [
    { label: "Listing moderation", icon: "shield", href: "/dashboard/moderation", desc: "Approve or reject new listings." },
    { label: "Profile verification", icon: "badge", href: "/dashboard/credentials", desc: "Verify credentials students submit." },
    { label: "Abuse reports", icon: "flag", href: "/dashboard/reports", desc: "Reports from users about listings, profiles or posts." },
  ] },
  { title: "Directory", items: [
    { label: "Companies", icon: "briefcase", href: "/dashboard/companies", desc: "Add and verify companies, set their plan, post listings for them." },
    { label: "Colleges", icon: "school", href: "/dashboard/colleges", desc: "Add colleges and verify the ones students can pick." },
    { label: "Mentors", icon: "sparkles", href: "/dashboard/mentors", desc: "Add mentors with full profile details, or edit them." },
    { label: "Users", icon: "users", href: "/dashboard/users", desc: "Add people, find, suspend or restore accounts." },
    { label: "Bulk upload", icon: "file", href: "/dashboard/bulk", desc: "Add many students, companies or mentors from an Excel or CSV file." },
    { label: "Events", icon: "calendar", href: "/dashboard/events", desc: "See every event, hide ones that break the rules, post your own." },
  ] },
  { title: "Platform", items: [
    { label: "Employer plans", icon: "card", href: "/dashboard/plans", desc: "Rename plans, change prices and limits, assign plans." },
    { label: "Site settings", icon: "file", href: "/dashboard/site", desc: "Announcement banner, support email and who can sign up." },
    { label: "Insights", icon: "chart", href: "/dashboard/insights", desc: "Platform-wide counts and trends." },
    { label: "Contact inbox", icon: "inbox", href: "/dashboard/inbox", desc: "Messages from the contact form." },
  ] },
  { title: "Operations", items: [
    { label: "Launch readiness", icon: "shield", href: "/dashboard/launch", desc: "What still needs doing before and after going live, read live from your data." },
    { label: "Audit log", icon: "log", href: "/dashboard/audit", desc: "Who did what, and when." },
    { label: "Server errors", icon: "alert", href: "/dashboard/errors", desc: "Errors recorded by the server." },
  ] },
];

export const MODULES: Record<Role, Section[]> = { STUDENT: student, EMPLOYER: employer, MENTOR: mentor, COLLEGE_ADMIN: college, PLATFORM_ADMIN: admin };

/** Every module that has tabs, for the tab bar. */
export const tabGroups = (role: Role): Tab[][] => MODULES[role].flatMap((s) => s.items).filter((m) => m.tabs).map((m) => m.tabs!);
