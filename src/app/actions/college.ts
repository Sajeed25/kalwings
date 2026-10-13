"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireActionRole } from "@/lib/session";
import { collegeSchema } from "@/lib/validation";
import { fail, obj, type Result } from "./_shared";

export async function createCollege(_: Result, fd: FormData): Promise<Result> {
  const u = await requireActionRole("COLLEGE_ADMIN");
  if (await db.collegeAdmin.findUnique({ where: { userId: u.id } })) return { error: "You already registered a college." };
  const r = collegeSchema.safeParse(obj(fd));
  if (!r.success) return fail(r.error);
  await db.college.create({ data: { name: r.data.name, city: r.data.city, admins: { create: { userId: u.id } } } }); // PENDING until a platform admin verifies
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}
