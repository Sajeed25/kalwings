"use server";
import { requireActionRole } from "@/lib/session";
import { sendPush } from "@/lib/push";
import type { Result } from "./_shared";

export type PushResult = Result & { note?: string };
/** Sends a test notification to the devices the signed-in person turned on. */
export async function sendTestPush(): Promise<PushResult> {
  const u = await requireActionRole();
  const n = await sendPush(u.id, { title: "Kalwings notifications are on", body: "You will see new matches and replies here, even when the app is closed.", url: "/dashboard/notifications" });
  return n > 0 ? { ok: true, note: `Sent to ${n} device${n === 1 ? "" : "s"}.` } : { error: "No device received it. Turn notifications on for this device first, and check this device allows them." };
}
