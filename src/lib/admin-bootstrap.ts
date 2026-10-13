import "server-only";
import type { User } from "@prisma/client";
import { db } from "@/lib/db";

/**
 * ADMIN_EMAILS (comma-separated) lists addresses that become PLATFORM_ADMIN when they sign in.
 * Safe because the address was proven by a one-time code or by Google's verified email.
 */
export async function maybePromoteAdmin(user: User): Promise<User> {
  const list = (process.env.ADMIN_EMAILS ?? "").toLowerCase().split(",").map((s) => s.trim()).filter(Boolean);
  if (!user.email || user.role === "PLATFORM_ADMIN" || !list.includes(user.email.toLowerCase())) return user;
  return db.user.update({ where: { id: user.id }, data: { role: "PLATFORM_ADMIN" } });
}
