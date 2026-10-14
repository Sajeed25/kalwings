import "server-only";
import nodemailer from "nodemailer";

/**
 * Sends transactional email over SMTP. Built for Hostinger's mailbox service (smtp.hostinger.com), works with any SMTP server.
 * Needs SMTP_HOST, SMTP_USER, SMTP_PASSWORD and EMAIL_FROM (the mailbox address, or an alias of it). SMTP_PORT defaults to 465 (SSL); 587 uses STARTTLS.
 * EMAIL_API_URL is a test-only hook: when set, a JSON POST goes there instead (used by the e2e mock mail server).
 */
const smtpConfigured = () => !!process.env.SMTP_HOST && !!process.env.SMTP_USER && !!process.env.SMTP_PASSWORD;
export const emailConfigured = () => !!process.env.EMAIL_FROM && (smtpConfigured() || !!process.env.EMAIL_API_URL);

let transport: nodemailer.Transporter | undefined;
function getTransport() {
  const port = Number(process.env.SMTP_PORT) || 465;
  return (transport ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST, port, secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 15_000,
  }));
}

/** Turns an SMTP failure into a log line that says what to fix. Never includes credentials. */
function explain(e: unknown): string {
  const x = e as { code?: string; responseCode?: number; response?: string; message?: string };
  const detail = String(x.response ?? x.message ?? "").replace(/\s+/g, " ").slice(0, 200);
  if (x.code === "EAUTH") return `SMTP login rejected (check SMTP_USER is the full mailbox address and SMTP_PASSWORD is that mailbox's password): ${detail}`;
  if (x.code === "ESOCKET" || x.code === "ECONNECTION" || x.code === "ETIMEDOUT" || x.code === "EDNS") return `could not reach the SMTP server (check SMTP_HOST and SMTP_PORT; use smtp.hostinger.com with 465, or 587): ${detail}`;
  if (x.code === "EENVELOPE" || x.responseCode === 553 || x.responseCode === 550) return `the server refused the sender or recipient (EMAIL_FROM must be the mailbox in SMTP_USER or one of its aliases): ${detail}`;
  return `${x.code ?? "error"}: ${detail}`;
}

export async function sendEmail({ to, subject, text }: { to: string; subject: string; text: string }) {
  if (!emailConfigured()) throw new Error("Email delivery is not configured");
  if (!smtpConfigured()) {
    const res = await fetch(process.env.EMAIL_API_URL!, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [to], subject, text }), signal: AbortSignal.timeout(10_000) });
    if (!res.ok) throw new Error(`Email test endpoint error ${res.status}`);
    return;
  }
  try {
    await getTransport().sendMail({ from: process.env.EMAIL_FROM, to, subject, text });
  } catch (e) {
    throw new Error(`Email SMTP error: ${explain(e)}`);
  }
}
