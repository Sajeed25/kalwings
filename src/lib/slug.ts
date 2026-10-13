import { randomBytes } from "crypto";
export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "member";
export const uniqueSlug = (name: string) => `${slugify(name)}-${randomBytes(3).toString("hex")}`;
