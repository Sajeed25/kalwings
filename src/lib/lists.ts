import type { Prisma } from "@prisma/client";

/** MySQL has no array columns, so lists are stored as JSON arrays. Always read them through this. */
export function asList(v: Prisma.JsonValue | null | undefined): string[] {
  return Array.isArray(v) ? v.filter((x): x is string | number => typeof x === "string" || typeof x === "number").map(String) : [];
}
