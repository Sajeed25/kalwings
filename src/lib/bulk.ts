import "server-only";
import { readSheet } from "read-excel-file/node";
import { z } from "zod";
import { db } from "@/lib/db";
import { uniqueSlug } from "@/lib/slug";
import { emailAccountReady } from "@/lib/account-email";

/** Bulk import of students, companies and mentors from an Excel (.xlsx) or CSV file. Every row is checked on its own: one bad row never blocks the rest. */
export const BULK_MAX_ROWS = 1000;
export const BULK_MAX_BYTES = 2_000_000;
export const BULK_MAX_EMAILS = 200;

export type BulkKind = "students" | "companies" | "mentors";
export type BulkRow = { n: number; label: string; status: "ok" | "skipped" | "error"; message: string };
export type BulkReport = { kind: BulkKind; committed: boolean; rows: BulkRow[]; counts: { ok: number; skipped: number; error: number }; emailsSent: number };

type Spec = { columns: string[]; required: string[]; sample: string[][]; help: string };
export const SPECS: Record<BulkKind, Spec> = {
  students: {
    columns: ["name", "email", "college", "graduation_year", "city"],
    required: ["name", "email"],
    sample: [["Asha Raman", "asha@example.com", "Sample Engineering College", "2026", "Chennai"]],
    help: "name and email are required. college must match a verified college by name (otherwise the student is added without one). Students sign in with an emailed code and fill in the rest themselves.",
  },
  companies: {
    columns: ["company", "website", "about", "plan", "hr_name", "hr_email"],
    required: ["company"],
    sample: [["Globex Pvt Ltd", "https://globex.example", "Product engineering studio.", "STARTER", "Priya Nair", "priya@globex.example"]],
    help: "company is required. New companies are created as verified. plan is a plan key or name (blank = the first active plan). hr_name and hr_email together add a recruiter; an existing company just gains that recruiter.",
  },
  mentors: {
    columns: ["name", "email", "role", "company", "country", "domain", "topics", "bio"],
    required: ["name", "email", "role", "company", "country", "domain"],
    sample: [["Maya Iyer", "maya@example.com", "Staff Engineer", "Globex", "India", "Backend", "APIs, Databases", "I mentor freshers on backend engineering."]],
    help: "name, email, role, company, country and domain are required. Mentors are added as verified and can update every detail themselves after signing in.",
  },
};

const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
export const templateCsv = (k: BulkKind) => "﻿" + [SPECS[k].columns, ...SPECS[k].sample].map((r) => r.map(esc).join(",")).join("\r\n") + "\r\n";

function parseCsv(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = [], cur = "", q = false;
  const t = text.replace(/^﻿/, "");
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(cur); cur = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && t[i + 1] === "\n") i++; row.push(cur); cur = ""; rows.push(row); row = []; }
    else cur += c;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows;
}

const cell = (v: unknown) => (v == null ? "" : v instanceof Date ? v.toISOString().slice(0, 10) : String(v)).trim();

/** Reads the first sheet of an .xlsx or a .csv into rows of text. Throws a message safe to show the admin. */
export async function readTable(file: File): Promise<string[][]> {
  if (file.size === 0) throw new Error("The file is empty.");
  if (file.size > BULK_MAX_BYTES) throw new Error(`The file is larger than ${BULK_MAX_BYTES / 1_000_000} MB. Split it into smaller files.`);
  const buf = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();
  let raw: unknown[][];
  try {
    if (name.endsWith(".csv")) raw = parseCsv(buf.toString("utf8"));
    else if (name.endsWith(".xlsx")) raw = (await readSheet(buf)) as unknown[][];
    else throw new Error("type");
  } catch (e) {
    throw new Error(e instanceof Error && e.message === "type" ? "Upload an .xlsx (Excel) or .csv file. Older .xls files: open them in Excel and Save As .xlsx." : "That file could not be read. Check that it is a valid Excel or CSV file.");
  }
  const rows = raw.map((r) => r.map(cell));
  while (rows.length && rows[rows.length - 1].every((c) => !c)) rows.pop();
  return rows;
}

const emailSchema = z.string().trim().toLowerCase().email().max(254);
const year = z.coerce.number().int().min(2000).max(2100);

type Ctx = { commit: boolean; sendEmails: boolean; seen: Set<string>; colleges: Map<string, string>; plans: { key: string; label: string; active: boolean }[]; emails: { name: string; email: string; extra?: string }[] };
type Out = { label: string; status: BulkRow["status"]; message: string };
const err = (label: string, message: string): Out => ({ label, status: "error", message });
const skip = (label: string, message: string): Out => ({ label, status: "skipped", message });
const good = (label: string, message: string): Out => ({ label, status: "ok", message });

async function student(r: Record<string, string>, c: Ctx): Promise<Out> {
  const label = r.email || r.name || "(blank)";
  const email = emailSchema.safeParse(r.email); if (!email.success) return err(label, "Not a valid email address.");
  if (r.name.length < 2 || r.name.length > 80) return err(label, "Name must be 2 to 80 characters.");
  if (c.seen.has(email.data)) return skip(label, "Appears twice in this file.");
  c.seen.add(email.data);
  if (await db.user.findUnique({ where: { email: email.data }, select: { id: true } })) return skip(label, "An account with this email already exists.");
  let gy: number | undefined; if (r.graduation_year) { const y = year.safeParse(r.graduation_year); if (!y.success) return err(label, "graduation_year must be a year like 2026."); gy = y.data; }
  const collegeId = r.college ? c.colleges.get(r.college.toLowerCase()) : undefined;
  const note = r.college && !collegeId ? " (college not found among verified colleges, added without one)" : "";
  if (c.commit) {
    await db.user.create({ data: { name: r.name, email: email.data, role: "STUDENT", student: { create: { slug: uniqueSlug(r.name), city: r.city.slice(0, 60) || null, graduationYear: gy ?? null, collegeId: collegeId ?? null } } } });
    c.emails.push({ name: r.name, email: email.data });
  }
  return good(label, `Student ${c.commit ? "added" : "will be added"}${note}.`);
}

async function mentor(r: Record<string, string>, c: Ctx): Promise<Out> {
  const label = r.email || r.name || "(blank)";
  const email = emailSchema.safeParse(r.email); if (!email.success) return err(label, "Not a valid email address.");
  const lim: [string, number][] = [["name", 80], ["role", 120], ["company", 120], ["country", 60], ["domain", 60], ["bio", 1500], ["topics", 300]];
  for (const [k, max] of lim) if (r[k].length > max) return err(label, `${k} is longer than ${max} characters.`);
  if (r.name.length < 2) return err(label, "Name must be at least 2 characters.");
  if (c.seen.has(email.data)) return skip(label, "Appears twice in this file.");
  c.seen.add(email.data);
  if (await db.user.findUnique({ where: { email: email.data }, select: { id: true } })) return skip(label, "An account with this email already exists.");
  if (c.commit) {
    await db.user.create({ data: { name: r.name, email: email.data, role: "MENTOR", mentor: { create: { slug: uniqueSlug(r.name), roleTitle: r.role, company: r.company, country: r.country, domain: r.domain, tags: r.topics.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 12), bio: r.bio || null, status: "VERIFIED", verifiedAt: new Date() } } } });
    c.emails.push({ name: r.name, email: email.data, extra: "After you sign in, open Mentor profile to add or change any detail: your role, company, domains, bio, photo and office-hour slots." });
  }
  return good(label, `Mentor ${c.commit ? "added" : "will be added"} as verified.`);
}

async function company(r: Record<string, string>, c: Ctx): Promise<Out> {
  const label = r.company || "(blank)";
  if (r.company.length < 2 || r.company.length > 120) return err(label, "Company name must be 2 to 120 characters.");
  let website: string | null = null;
  if (r.website) { try { const u = new URL(r.website); if (!/^https?:$/.test(u.protocol)) throw new Error(); website = u.toString().slice(0, 400); } catch { return err(label, "website must start with http:// or https://"); } }
  if (r.about.length > 1500) return err(label, "about is longer than 1500 characters.");
  const active = c.plans.filter((p) => p.active);
  const plan = r.plan ? c.plans.find((p) => p.key.toLowerCase() === r.plan.toLowerCase() || p.label.toLowerCase() === r.plan.toLowerCase()) : active[0];
  if (!plan) return err(label, `Unknown plan “${r.plan}”.`);
  if (!!r.hr_name !== !!r.hr_email) return err(label, "Give both hr_name and hr_email, or leave both empty.");
  let hrEmail = ""; if (r.hr_email) { const e = emailSchema.safeParse(r.hr_email); if (!e.success) return err(label, "hr_email is not a valid email address."); hrEmail = e.data; if (r.hr_name.length < 2 || r.hr_name.length > 80) return err(label, "hr_name must be 2 to 80 characters."); }
  const key = r.company.toLowerCase();
  if (c.seen.has(key)) return skip(label, "Appears twice in this file.");
  c.seen.add(key);
  const existing = await db.company.findFirst({ where: { name: r.company } });
  if (existing?.status === "REJECTED") return err(label, "This company was rejected earlier. Change its status first.");
  if (hrEmail) {
    if (c.seen.has(hrEmail)) return skip(label, "That hr_email appears twice in this file.");
    c.seen.add(hrEmail);
    if (await db.user.findUnique({ where: { email: hrEmail }, select: { id: true } })) return err(label, "An account with hr_email already exists.");
  }
  if (existing && !hrEmail) return skip(label, "Company already exists.");
  if (c.commit) {
    await db.$transaction(async (tx) => {
      const co = existing ?? await tx.company.create({ data: { name: r.company, website, about: r.about || null, plan: plan.key, status: "VERIFIED", verifiedAt: new Date() } });
      if (existing && existing.status !== "VERIFIED") await tx.company.update({ where: { id: existing.id }, data: { status: "VERIFIED", verifiedAt: new Date() } });
      if (hrEmail) await tx.user.create({ data: { name: r.hr_name, email: hrEmail, role: "EMPLOYER", employer: { create: { companyId: co.id } } } });
    });
    if (hrEmail) c.emails.push({ name: r.hr_name, email: hrEmail });
  }
  return good(label, `${existing ? "Recruiter " + (c.commit ? "added to" : "will be added to") + " the existing company" : "Company " + (c.commit ? "added" : "will be added") + " as verified"}${hrEmail && !existing ? " with a recruiter" : ""}.`);
}

const PROCESS = { students: student, companies: company, mentors: mentor } as const;

export async function runBulk(kind: BulkKind, table: string[][], opts: { commit: boolean; sendEmails: boolean }): Promise<BulkReport | { error: string }> {
  const spec = SPECS[kind];
  if (table.length < 2) return { error: "The file has no data rows. Use the template: the first row holds the column names." };
  if (table.length - 1 > BULK_MAX_ROWS) return { error: `Too many rows (${table.length - 1}). Upload at most ${BULK_MAX_ROWS} at a time.` };
  const head = table[0].map((h) => h.toLowerCase().replace(/[\s-]+/g, "_"));
  const missing = spec.required.filter((k) => !head.includes(k));
  if (missing.length) return { error: `Missing column${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}. Download the template to see the expected columns.` };
  const [colleges, plans] = await Promise.all([
    kind === "students" ? db.college.findMany({ where: { status: "VERIFIED" }, select: { id: true, name: true } }) : Promise.resolve([]),
    kind === "companies" ? db.planConfig.findMany({ orderBy: { position: "asc" }, select: { key: true, label: true, active: true } }) : Promise.resolve([]),
  ]);
  const ctx: Ctx = { commit: opts.commit, sendEmails: opts.sendEmails, seen: new Set(), colleges: new Map(colleges.map((x) => [x.name.toLowerCase(), x.id])), plans, emails: [] };
  const rows: BulkRow[] = [];
  for (let i = 1; i < table.length; i++) {
    const line = table[i];
    const rec: Record<string, string> = Object.fromEntries(spec.columns.map((k) => [k, ""]));
    head.forEach((h, j) => { if (h in rec) rec[h] = line[j] ?? ""; });
    let out: Out;
    try { out = await PROCESS[kind](rec, ctx); }
    catch (e) { console.error(`[bulk] ${kind} row ${i + 1} failed:`, e instanceof Error ? e.message : e); out = err(rec.email || rec.company || rec.name || "(blank)", "Could not be saved. Check the values and try again."); }
    rows.push({ n: i + 1, ...out });
  }
  let emailsSent = 0;
  if (opts.commit && opts.sendEmails) for (const m of ctx.emails.slice(0, BULK_MAX_EMAILS)) { const t = await emailAccountReady(m); if (/We emailed/.test(t)) emailsSent++; }
  const counts = { ok: 0, skipped: 0, error: 0 };
  for (const r of rows) counts[r.status]++;
  return { kind, committed: opts.commit, rows, counts, emailsSent };
}
