import "server-only";
import webpush from "web-push";
import { db } from "@/lib/db";

export type Vapid = { publicKey: string; privateKey: string };
let cached: Vapid | null = null;

/**
 * The key pair that lets this server send push notifications. VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY win if set; otherwise a pair is created the first
 * time it is needed and kept in the database (SiteSetting "vapid"), so no one has to generate or paste keys. Replacing the pair signs every device out of push.
 */
export async function vapid(): Promise<Vapid> {
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) return { publicKey: process.env.VAPID_PUBLIC_KEY, privateKey: process.env.VAPID_PRIVATE_KEY };
  if (cached) return cached;
  const read = async () => { const r = await db.siteSetting.findUnique({ where: { key: "vapid" } }); try { const v = r ? (JSON.parse(r.value) as Vapid) : null; return v?.publicKey && v.privateKey ? v : null; } catch { return null; } };
  let v = await read();
  if (!v) { await db.siteSetting.createMany({ data: [{ key: "vapid", value: JSON.stringify(webpush.generateVAPIDKeys()) }], skipDuplicates: true }); v = await read(); }
  if (!v) throw new Error("Could not create push keys");
  return (cached = v);
}
