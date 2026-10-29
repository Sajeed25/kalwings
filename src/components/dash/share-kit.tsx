import QRCode from "qrcode";
import { CopyButton } from "@/components/dash/copy-button";
import { shareLinks, shortUrl } from "@/lib/distribution";
import { TYPE_LABEL } from "@/lib/opportunity-types";
import type { Opportunity } from "@prisma/client";

/** Share tools for one approved listing. Kalwings does not post to third-party boards for you; these links help you do it in one click. */
export async function ShareKit({ o, company }: { o: Opportunity; company: string }) {
  const url = shortUrl(o);
  const links = shareLinks(url, `${o.title} at ${company}`);
  const qr = await QRCode.toString(shortUrl(o, "qr"), { type: "svg", margin: 1, width: 120 });
  const text = `${company} is hiring: ${o.title}\n${TYPE_LABEL[o.type]} · ${o.location} · ${o.payText}${o.unpaid ? " (Unpaid)" : ""}\nEligibility: ${o.eligibility}\nApply by ${o.deadline.toLocaleDateString("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" })}: ${url}`;
  return (
    <details className="mt-2 text-sm"><summary className="cursor-pointer font-semibold text-accent">Share &amp; distribute</summary>
      <div className="mt-3 flex flex-wrap items-start gap-4 rounded-xl border border-line p-3">
        <div className="space-y-2">
          <p className="break-all text-xs text-ink-soft">{url}</p>
          <div className="flex flex-wrap gap-2">
            <CopyButton text={url} label="Copy link" /><CopyButton text={text} label="Copy post text" />
            {(["linkedin", "whatsapp", "x", "email"] as const).map((k) => <a key={k} href={links[k]} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold hover:bg-muted">{{ linkedin: "LinkedIn", whatsapp: "WhatsApp", x: "X", email: "Email" }[k]}</a>)}
          </div>
        </div>
        <div role="img" aria-label={`QR code for ${o.title}`} className="rounded-lg bg-white p-1" dangerouslySetInnerHTML={{ __html: qr }} />
      </div>
    </details>
  );
}
