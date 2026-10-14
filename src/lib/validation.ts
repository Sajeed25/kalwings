import { TYPE_KEYS } from "@/lib/opportunity-types";
import { z } from "zod";

const text = (max: number) => z.string().trim().max(max);
const url = z.string().trim().url().max(300).refine((u) => /^https?:\/\//.test(u), "Must be http(s)");
const optUrl = z.union([url, z.literal("")]).optional().transform((v) => v || undefined);

export const identifierSchema = z.object({ identifier: text(254).min(5) });
export const otpSchema = z.object({ identifier: text(254).min(5), code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"), name: text(80).optional(), role: z.enum(["STUDENT", "MENTOR", "EMPLOYER", "COLLEGE_ADMIN"]).optional() });

export const profileSchema = z.object({
  name: text(80).min(2),
  headline: text(120).min(3),
  bio: text(600).optional().default(""),
  city: text(60).optional().default(""),
  graduationYear: z.coerce.number().int().min(2020).max(2032),
  githubUrl: optUrl,
  skills: text(300).optional().default(""),
  lookingFor: text(120).optional().default(""),
});

export const projectSchema = z.object({ title: text(100).min(3), summary: text(800).min(10), githubUrl: optUrl, demoUrl: optUrl });

export const sessionRequestSchema = z.object({ mentorId: z.string().cuid(), slotId: z.string().cuid().optional().or(z.literal("")), topic: text(120).min(3), message: text(500).optional().default("") });

export const mentorProfileSchema = z.object({ roleTitle: text(80).min(2), company: text(80).min(2), country: text(60).min(2), domain: text(40).min(2), tags: text(200).optional().default(""), bio: text(600).optional().default("") });

// <input type="datetime-local"> carries no timezone. Users are in India, so read it as IST regardless of the server's timezone.
export const istDateTime = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Pick a date and time").transform((v) => new Date(`${v}:00+05:30`));

export const slotSchema = z.object({ startsAt: istDateTime.refine((d) => d.getTime() > Date.now(), "Must be in the future"), minutes: z.coerce.number().int().min(15).max(120) });

export const endorsementSchema = z.object({ studentId: z.string().cuid(), skill: text(60).min(2), text: text(400).min(10), evidence: url });

export const companySchema = z.object({ name: text(100).min(2), website: url, about: text(500).optional().default("") });

// Trust rules: pay, work mode, location and eligibility are mandatory on every listing.
export const opportunitySchema = z.object({
  title: text(120).min(3),
  type: z.enum(TYPE_KEYS),
  description: text(3000).min(30),
  unpaid: z.coerce.boolean().default(false),
  payText: text(80).min(2, "Pay is required — say 'Unpaid' if there is none"),
  monthlyINR: z.coerce.number().int().min(0).max(1_000_000).default(0),
  workMode: z.enum(["REMOTE", "HYBRID", "ONSITE"]),
  location: text(80).min(2),
  eligibility: text(120).min(3),
  gradYears: text(60).optional().default(""),
  skills: text(200).optional().default(""),
  deadline: z.coerce.date().refine((d) => d.getTime() > Date.now(), "Deadline must be in the future"),
}).refine((o) => !o.unpaid || o.monthlyINR === 0, { message: "Unpaid roles can't have a stipend amount", path: ["monthlyINR"] })
  .refine((o) => o.unpaid || /\d/.test(o.payText), { message: "Paid roles must state the amount", path: ["payText"] });

export const noteSchema = z.object({ applicationId: z.string().cuid(), notes: text(1000) });
export const feedbackSchema = z.object({
  interviewId: z.string().cuid(),
  rating: z.coerce.number().int().min(1, "Choose a rating from 1 to 5").max(5),
  recommendation: z.enum(["STRONG_YES", "YES", "NO", "STRONG_NO"]),
  strengths: text(800).optional().default(""),
  concerns: text(800).optional().default(""),
});
export const templateSchema = z.object({ name: text(60).min(2, "Give the template a name"), body: text(1000).min(10, "Write the message") });
export const messageSchema = z.object({ applicationId: z.string().cuid(), body: text(1000).min(1) });
export const reportSchema = z.object({ targetType: z.enum(["OPPORTUNITY", "MENTOR", "STUDENT", "COMPANY", "POST", "COMMENT", "GROUP"]), targetId: z.string().cuid(), reason: text(500).min(10) });

export const csv = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean).slice(0, 15);

export const contactSchema = z.object({
  name: text(80).min(2),
  email: z.string().trim().email().max(254),
  topic: z.enum(["Student", "Employer", "College", "Mentor", "Press"]),
  message: text(2000).min(10),
  website: z.string().max(0).optional(), // honeypot: bots fill it, humans never see it
});

export const collegeSchema = z.object({ name: text(120).min(3), city: text(60).min(2) });
export const studentCollegeSchema = z.object({ collegeId: z.string().cuid().optional().or(z.literal("")), share: z.string().optional() });

const vis = z.enum(["PUBLIC", "RECRUITERS", "PRIVATE"]);
export const privacySchema = z.object({ passportVisibility: vis, projectsVisibility: vis, endorsementsVisibility: vis, entriesVisibility: vis });
export const entrySchema = z.object({
  kind: z.enum(["EXPERIENCE", "ACHIEVEMENT", "HACKATHON", "CERTIFICATE"]),
  title: text(120).min(3), org: text(120).optional().default(""), year: z.union([z.coerce.number().int().min(1990).max(2035), z.literal("")]).optional().transform((v) => (v === "" || v === undefined ? undefined : v)),
  url: optUrl, summary: text(600).optional().default(""),
});

export const interviewSchema = z.object({
  applicationId: z.string().cuid(),
  scheduledAt: istDateTime.refine((d) => d.getTime() > Date.now(), "Pick a time in the future"),
  minutes: z.coerce.number().int().min(15).max(240),
  mode: z.enum(["VIDEO", "PHONE", "ONSITE"]),
  detail: text(300).min(3, "Add the meeting link, phone number or address"),
  notes: text(500).optional().default(""),
});
export const offerSchema = z.object({
  applicationId: z.string().cuid(),
  summary: text(400).min(10, "Describe the role, pay and key terms"),
  joiningDate: z.union([z.coerce.date(), z.literal("")]).optional().transform((v) => (v === "" || v === undefined ? undefined : v)),
});
export const inviteSchema = z.object({ email: z.string().trim().toLowerCase().email().max(254) });
export const stageLabelsSchema = z.object({
  UNDER_REVIEW: text(24).optional().default(""), SHORTLISTED: text(24).optional().default(""), INTERVIEW: text(24).optional().default(""), OFFER: text(24).optional().default(""), HIRED: text(24).optional().default(""),
});

const rubricLine = z.string().trim();
export const challengeSchema = z.object({
  title: text(120).min(3),
  description: text(600).min(30, "Add a short public summary (30+ characters)"),
  kind: z.enum(["CODING", "SOFTWARE", "DATA_SQL", "DESIGN", "BUSINESS_CASE", "MARKETING", "HARDWARE_IOT", "RESEARCH", "OTHER"]),
  style: z.enum(["COMPETITIVE", "COLLABORATIVE", "PORTFOLIO"]),
  allowTeams: z.coerce.boolean().default(false),
  brief: text(5000).min(50, "The brief needs the problem, deliverables and constraints (50+ characters)"),
  rubric: rubricLine.min(5, "Add at least 2 criteria"),
  skillTag: text(60).optional().default(""),
  unpaid: z.coerce.boolean().default(false),
  payText: text(80).min(2, "Say what participants receive (prize, stipend, interview or 'Certificate only')"),
  workMode: z.enum(["REMOTE", "HYBRID", "ONSITE"]),
  location: text(80).min(2),
  eligibility: text(120).min(3),
  deadline: z.coerce.date().refine((d) => d.getTime() > Date.now(), "Deadline must be in the future"),
});

/** One criterion per line: "Criterion | max points | what good looks like". 2 to 8 criteria, 1 to 100 points each. */
export function parseRubric(text: string): { criterion: string; max: number; description: string }[] | string {
  const rows = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (rows.length < 2 || rows.length > 8) return "Use 2 to 8 rubric lines, one criterion per line.";
  const out: { criterion: string; max: number; description: string }[] = [];
  for (const r of rows) {
    const [criterion, max, ...rest] = r.split("|").map((x) => x.trim());
    const n = Number(max);
    if (!criterion || criterion.length > 80 || !Number.isInteger(n) || n < 1 || n > 100) return `Rubric line "${r.slice(0, 40)}" must look like: Criterion | max points (1-100) | description`;
    out.push({ criterion, max: n, description: rest.join(" | ").slice(0, 200) });
  }
  return out;
}

export const submissionSchema = z.object({
  challengeId: z.string().cuid(),
  title: text(120).min(3),
  summary: text(1500).min(30, "Describe your approach (30+ characters)"),
  workUrl: url,
  teamNote: text(300).optional().default(""),
});

export const reviewSchema = z.object({
  submissionId: z.string().cuid(),
  feedback: text(1500).min(10, "Give the candidate some written feedback"),
  outcome: z.enum(["REVIEWED", "SHORTLISTED", "NOT_SELECTED"]),
  awardSkill: z.coerce.boolean().default(false),
});

export type TestCase = { input: string; expected: string; hidden: boolean };
/** Tests are separated by a line "###"; input and expected output by a line "=>"; start a test with "[hidden]" to hide it from candidates. */
export function parseTests(text: string): TestCase[] | string {
  const blocks = text.replace(/\r\n/g, "\n").split(/^###\s*$/m).map((b) => b.trim()).filter(Boolean);
  if (blocks.length < 1 || blocks.length > 15) return "Add 1 to 15 tests.";
  const out: TestCase[] = [];
  for (const raw of blocks) {
    let b = raw, hidden = false;
    if (/^\[hidden\]/i.test(b)) { hidden = true; b = b.replace(/^\[hidden\]\s*/i, ""); }
    const parts = b.split(/^=>\s*$/m);
    if (parts.length !== 2 || !parts[1].trim()) return 'Each test needs input, a line with only "=>", then the expected output.';
    const input = parts[0].replace(/^\n+|\n+$/g, ""), expected = parts[1].trim();
    if (input.length > 2000 || expected.length > 2000) return "Each test's input and output must be under 2000 characters.";
    out.push({ input: input + "\n", expected, hidden });
  }
  return out;
}

export const assessmentSchema = z.object({
  kind: z.enum(["CODING", "WRITTEN"]),
  title: text(120).min(3),
  instructions: text(4000).min(30, "Write clear instructions (30+ characters)"),
  items: text(6000).min(3, "Add the tests or questions"),
  timeLimitMs: z.coerce.number().int().min(500).max(10000).default(2000),
  memoryMb: z.coerce.number().int().min(32).max(512).default(128),
  closesAt: z.union([z.coerce.date(), z.literal("")]).optional().transform((v) => (v === "" || v === undefined ? undefined : v)),
});

export const attemptSchema = z.object({ assessmentId: z.string().cuid(), language: z.string().max(20), code: z.string().min(1, "Write some code first").max(20000, "Code is limited to 20,000 characters") });
export const writtenAttemptSchema = z.object({ assessmentId: z.string().cuid() });
export const writtenReviewSchema = z.object({ attemptId: z.string().cuid(), feedback: text(1500).min(10, "Give the candidate some written feedback") });

export const groupSchema = z.object({ name: text(80).min(3), description: text(500).min(10, "Say what the group is for (10+ characters)"), kind: z.enum(["INTEREST", "PROJECT"]) });
export const postSchema = z.object({
  groupId: z.string().cuid(), kind: z.enum(["DISCUSSION", "QUESTION", "PROJECT_CALL", "EVENT"]),
  title: text(140).min(3), body: text(3000).min(10, "Write a little more (10+ characters)"), tags: text(200).optional().default(""),
  eventAt: z.union([istDateTime, z.literal("")]).optional().transform((v) => (v === "" || v === undefined ? undefined : v)),
});
export const commentSchema = z.object({ postId: z.string().cuid(), body: text(1000).min(2) });

export const departmentSchema = z.object({ name: text(80).min(2) });
export const driveSchema = z.object({
  companyId: z.string().cuid(), title: text(120).min(3), description: text(2000).min(20, "Describe the drive: roles, process and timeline (20+ characters)"),
  driveDate: z.coerce.date().refine((d) => d.getTime() > Date.now(), "The drive date must be in the future"),
  gradYears: text(60).optional().default(""), minCompleteness: z.coerce.number().int().min(0).max(100).default(0),
});
export const studentDepartmentSchema = z.object({ departmentId: z.string().cuid().optional().or(z.literal("")) });
