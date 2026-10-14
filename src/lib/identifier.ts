/**
 * Who someone signs in as. Email only for now: mobile numbers are recognised but refused unless MOBILE_LOGIN=true,
 * which should only be set once an SMS provider is connected (otherwise people would never receive a code).
 */
export const mobileLoginEnabled = () => process.env.MOBILE_LOGIN === "true";

export function normaliseIdentifier(raw: string): { kind: "email" | "phone"; value: string } | null {
  const v = raw.trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.length <= 254) return { kind: "email", value: v.toLowerCase() };
  if (!mobileLoginEnabled()) return null;
  const digits = v.replace(/[\s()-]/g, "");
  if (/^\+?\d{10,14}$/.test(digits)) return { kind: "phone", value: digits.startsWith("+") ? digits : digits.length === 10 ? `+91${digits}` : `+${digits}` };
  return null;
}
