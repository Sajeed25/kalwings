import "server-only";
import { db } from "@/lib/db";
import { LEGAL } from "@/lib/legal";

/** Platform-wide settings a platform admin can change (Dashboard > Site settings). Defaults apply if nothing is saved or the database is unreachable. */
export const SIGNUP_ROLES = ["STUDENT", "MENTOR", "EMPLOYER", "COLLEGE_ADMIN"] as const;
export type SignupRole = (typeof SIGNUP_ROLES)[number];
export const ROLE_NAME: Record<SignupRole, string> = { STUDENT: "students", MENTOR: "mentors", EMPLOYER: "employers", COLLEGE_ADMIN: "colleges" };

export type Settings = { announcement: string; supportEmail: string; signup: Record<SignupRole, boolean> };

export async function getSettings(): Promise<Settings> {
  const out: Settings = { announcement: "", supportEmail: LEGAL.email, signup: { STUDENT: true, MENTOR: true, EMPLOYER: true, COLLEGE_ADMIN: true } };
  try {
    const rows = await db.siteSetting.findMany();
    for (const r of rows) {
      if (r.key === "announcement") out.announcement = r.value;
      else if (r.key === "supportEmail" && r.value) out.supportEmail = r.value;
      else if (r.key.startsWith("signup.")) { const role = r.key.slice(7) as SignupRole; if (SIGNUP_ROLES.includes(role)) out.signup[role] = r.value !== "off"; }
    }
  } catch (e) { console.error("[settings] could not load settings:", e instanceof Error ? e.message : e); }
  return out;
}

/** Message to show when self-sign-up for this role is switched off, or null when it is open. */
export async function signupClosedMessage(role: string): Promise<string | null> {
  if (!(SIGNUP_ROLES as readonly string[]).includes(role)) return null;
  const s = await getSettings();
  return s.signup[role as SignupRole] ? null : `New sign-ups for ${ROLE_NAME[role as SignupRole]} are closed right now. Please contact us.`;
}
