"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireActionRole } from "@/lib/session";
import { fail, obj, type Result } from "./_shared";
import { TYPE_KEYS } from "@/lib/opportunity-types";

const text = (n: number) => z.string().trim().max(n);
const schema = z.object({
  q: text(80).optional().default(""), location: text(60).optional().default(""),
  type: z.union([z.literal(""), z.enum(TYPE_KEYS)]).optional().default(""), mode: z.union([z.literal(""), z.enum(["REMOTE", "HYBRID", "ONSITE"])]).optional().default(""),
}).refine((a) => a.q || a.location || a.type || a.mode, { message: "Choose at least one thing to watch for: a keyword, a city, a type or a work mode." });
const NAME = { INTERNSHIP: "internships", JOB: "fresher jobs", GRADUATE_TRAINEE: "graduate trainee roles", APPRENTICESHIP: "apprenticeships", CAMPUS: "campus hiring", FREELANCE: "freelance projects", CHALLENGE: "challenges" } as const;
const MODE = { REMOTE: "remote", HYBRID: "hybrid", ONSITE: "on-site" } as const;

/** Saves the search a student is looking at. They are told in-app, and by email unless they unsubscribed, when a matching listing goes live. */
export async function createAlert(_: Result, fd: FormData): Promise<Result> {
  const u = await requireActionRole("STUDENT");
  const r = schema.safeParse(obj(fd)); if (!r.success) return fail(r.error);
  const d = r.data;
  if ((await db.jobAlert.count({ where: { userId: u.id } })) >= 10) return { error: "You can keep up to 10 alerts. Delete one first." };
  const label = [d.type ? NAME[d.type as keyof typeof NAME] : "opportunities", d.q && `matching “${d.q}”`, d.mode && MODE[d.mode as keyof typeof MODE], d.location && `in ${d.location}`].filter(Boolean).join(" ").slice(0, 100);
  if (await db.jobAlert.findFirst({ where: { userId: u.id, q: d.q || null, type: d.type || null, mode: d.mode || null, location: d.location || null } })) return { ok: true };
  await db.jobAlert.create({ data: { userId: u.id, label, q: d.q || null, type: d.type || null, mode: d.mode || null, location: d.location || null } });
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export async function deleteAlert(id: string) {
  const u = await requireActionRole("STUDENT");
  await db.jobAlert.deleteMany({ where: { id, userId: u.id } });
  revalidatePath("/dashboard", "layout");
}
