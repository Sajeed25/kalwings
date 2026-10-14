import "server-only";
import { emailConfigured, sendEmail } from "@/lib/email";
import { site } from "@/lib/site";

/** Tells someone an administrator set up their account. Returns a sentence for the admin describing what happened. Never throws. */
export async function emailAccountReady(o: { name: string; email: string; extra?: string }): Promise<string> {
  const how = `sign in at ${site.url}/login with this email`;
  if (!emailConfigured()) return ` Email is not configured, so tell them to ${how}.`;
  try {
    await sendEmail({ to: o.email, subject: "Your Kalwings account is ready", text: `Hi ${o.name},\n\nAn administrator has set up a Kalwings account for you.\n\nSign in at ${site.url}/login with this email address (${o.email}). We will email you a one-time code; there is no password to remember.${o.extra ? `\n\n${o.extra}` : ""}\n\nIf you were not expecting this, you can ignore this email.` });
    return " We emailed them how to sign in.";
  } catch (e) {
    console.error(`[email] account-ready email was not sent: ${e instanceof Error ? e.message : e}`);
    return ` The notification email could not be sent, so tell them to ${how}.`;
  }
}
