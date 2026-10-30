"use client";
import { useEffect, useState } from "react";
import { CopyButton } from "@/components/dash/copy-button";

const ch = (link: string, src: string, ref?: string) => `${link}${link.includes("?") ? "&" : "?"}src=${src}${ref ? `&ref=${encodeURIComponent(ref)}` : ""}`;

/**
 * Share one listing with friends: a ready message (role, company, pay, place, deadline and a short link) for WhatsApp, Telegram, LinkedIn, X,
 * email, the phone's own share sheet, or a plain copied link. Every channel tags the link, so employers can see where applicants came from, and a
 * signed-in student's link carries a referral that employers can see. Sharing never changes how anyone is assessed.
 */
export function SharePanel({ title, company, details, link, refId, heading = "Share this with friends who might fit" }: { title: string; company: string; details: string; link: string; refId?: string; heading?: string }) {
  const [canNative, setCanNative] = useState(false);
  useEffect(() => { setCanNative(typeof navigator !== "undefined" && typeof navigator.share === "function"); }, []);
  const msg = (src: string) => `${title} at ${company}\n${details}\nApply: ${ch(link, src, refId)}`;
  const L = {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(msg("whatsapp"))}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(ch(link, "telegram", refId))}&text=${encodeURIComponent(`${title} at ${company}\n${details}`)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(ch(link, "linkedin", refId))}`,
    x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${title} at ${company}. ${details}`)}&url=${encodeURIComponent(ch(link, "x", refId))}`,
    email: `mailto:?subject=${encodeURIComponent(`${title} at ${company}`)}&body=${encodeURIComponent(msg("email"))}`,
  };
  const pill = "inline-flex h-10 items-center rounded-full border border-line px-4 text-sm font-semibold hover:border-accent";
  return (
    <section aria-label="Share this opportunity" className="mt-8 rounded-card border border-line p-5">
      <h2 className="text-lg font-bold">{heading}</h2>
      <p className="mt-1 text-sm text-ink-soft">One tap sends the role, the pay and where it is, with a short link they can open and apply from.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <a href={L.whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-bold text-on-primary">Share on WhatsApp</a>
        {canNative && <button type="button" className={pill} onClick={() => navigator.share({ title: `${title} at ${company}`, text: `${title} at ${company}\n${details}`, url: ch(link, "share", refId) }).catch(() => {})}>Share…</button>}
        <a href={L.telegram} target="_blank" rel="noopener noreferrer" className={pill}>Telegram</a>
        <a href={L.linkedin} target="_blank" rel="noopener noreferrer" className={pill}>LinkedIn</a>
        <a href={L.x} target="_blank" rel="noopener noreferrer" className={pill}>X</a>
        <a href={L.email} className={pill}>Email</a>
        <CopyButton text={ch(link, "link", refId)} label="Copy link" />
      </div>
      <p className="mt-3 break-all text-xs text-ink-soft">{ch(link, "link", refId)}</p>
    </section>
  );
}
