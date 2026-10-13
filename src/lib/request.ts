import "server-only";
import { headers } from "next/headers";

export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "unknown";
}

/** CSRF defence for route handlers (Server Actions already enforce Origin == Host). */
export async function assertSameOrigin() {
  const h = await headers();
  const origin = h.get("origin");
  if (origin && new URL(origin).host !== h.get("host")) throw new Error("Bad origin");
}
