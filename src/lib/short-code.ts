import "server-only";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";

const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"; // no look-alikes (i, l, o, 0, 1)
/** A short, easy-to-read code for share links (/j/<code>). Checked against the database so it is always unique. */
export async function uniqueShortCode(): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const bytes = randomBytes(8);
    const code = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
    if (!(await db.opportunity.findUnique({ where: { shortCode: code }, select: { id: true } }))) return code;
  }
  throw new Error("Could not allocate a short link");
}

/** Same, for events (/e/<code>). */
export async function uniqueEventCode(): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const code = Array.from(randomBytes(8), (b) => ALPHABET[b % ALPHABET.length]).join("");
    if (!(await db.event.findUnique({ where: { shortCode: code }, select: { id: true } }))) return code;
  }
  throw new Error("Could not allocate a short link");
}
