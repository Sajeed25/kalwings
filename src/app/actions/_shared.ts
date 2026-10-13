import type { ZodError } from "zod";
export type Result = { ok?: boolean; error?: string; fieldErrors?: Record<string, string> };
export const fail = (e: ZodError): Result => ({ error: e.issues[0]?.message ?? "Invalid input", fieldErrors: Object.fromEntries(e.issues.map((i) => [String(i.path[0]), i.message])) });
export const obj = (fd: FormData) => Object.fromEntries(Array.from(fd.entries()).filter(([, v]) => typeof v === "string"));
