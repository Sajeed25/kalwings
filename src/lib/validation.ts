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

export const slotSchema = z.object({ startsAt: z.coerce.date().refine((d) => d.getTime() > Date.now(), "Must be in the future"), minutes: z.coerce.number().int().min(15).max(120) });

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
export const messageSchema = z.object({ applicationId: z.string().cuid(), body: text(1000).min(1) });
export const reportSchema = z.object({ targetType: z.enum(["OPPORTUNITY", "MENTOR", "STUDENT", "COMPANY"]), targetId: z.string().cuid(), reason: text(500).min(10) });

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
