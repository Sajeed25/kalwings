import { site } from "@/lib/site";

export const SLUG_RE = /^[a-z0-9][a-z0-9-]{2,39}$/;
const RESERVED = new Set(["admin", "api", "app", "careers", "embed", "feeds", "kalwings", "login", "support", "www", "dashboard", "static"]);

export function slugProblem(s: string): string | null {
  if (!SLUG_RE.test(s)) return "Use 3–40 lowercase letters, numbers or hyphens, starting with a letter or number.";
  if (s.endsWith("-") || s.includes("--")) return "Avoid trailing or double hyphens.";
  if (RESERVED.has(s)) return "That address is reserved. Please choose another.";
  return null;
}

/** Candidate source tag from a share link (?src=). Only a safe allow-list of characters is stored. */
export function cleanSource(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.toLowerCase().trim();
  return /^[a-z0-9][a-z0-9_-]{0,29}$/.test(s) ? s : null;
}

export const SOURCE_LABEL: Record<string, string> = { linkedin: "LinkedIn", whatsapp: "WhatsApp", x: "X / Twitter", email: "Email", careers: "Career page", embed: "Embedded widget", telegram: "Telegram", link: "Copied link", share: "Phone share", referral: "Referral", qr: "QR code", direct: "Direct link" };
export const sourceLabel = (s: string | null | undefined) => (s ? SOURCE_LABEL[s] ?? s : "Kalwings marketplace");

export const xmlEscape = (s: string) => s.replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[c]!);
export const cdata = (s: string) => `<![CDATA[${s.replace(/\]\]>/g, "]]]]><![CDATA[>")}]]>`;

export const jobUrl = (id: string, src?: string) => `${site.url}/opportunities/${id}${src ? `?src=${src}` : ""}`;
/** The short, friendly link to share (falls back to the long one for old rows without a code). */
export const shortUrl = (o: { id: string; shortCode?: string | null }, src?: string) => o.shortCode ? `${site.url}/j/${o.shortCode}${src ? `?src=${src}` : ""}` : jobUrl(o.id, src);
export function shareLinks(url: string, title: string) {
  const t = encodeURIComponent(title), u = (s: string) => encodeURIComponent(`${url}${url.includes("?") ? "&" : "?"}src=${s}`);
  return {
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${u("linkedin")}`,
    whatsapp: `https://wa.me/?text=${t}%20${u("whatsapp")}`,
    x: `https://twitter.com/intent/tweet?text=${t}&url=${u("x")}`,
    email: `mailto:?subject=${t}&body=${u("email")}`,
  };
}
