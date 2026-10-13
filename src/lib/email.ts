import "server-only";

/**
 * Sends transactional email through Resend's HTTP API (https://resend.com).
 * Needs EMAIL_API_KEY and EMAIL_FROM (a sender on a domain you've verified with Resend).
 * To use another provider, replace the body of this one function.
 */
export const emailConfigured = () => !!process.env.EMAIL_API_KEY && !!process.env.EMAIL_FROM;

export async function sendEmail({ to, subject, text }: { to: string; subject: string; text: string }) {
  if (!emailConfigured()) throw new Error("Email delivery is not configured");
  const res = await fetch(process.env.EMAIL_API_URL ?? "https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.EMAIL_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [to], subject, text }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Email provider error ${res.status}`);
}
