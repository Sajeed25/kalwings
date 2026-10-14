import { careerPage } from "@/lib/careers";
import { xmlEscape } from "@/lib/distribution";
import { TYPE_LABEL } from "@/lib/opportunity-types";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";
const MODE = { REMOTE: "Remote", HYBRID: "Hybrid", ONSITE: "On-site" } as const;

/** Self-contained, frameable list of open roles for a company's own website: <iframe src=".../embed/careers/<slug>">. next.config.mjs allows framing for /embed/ only. */
export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const r = await careerPage((await params).slug);
  if (!r) return new Response("Not found", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
  const items = r.jobs.map((o) => `<li><a href="${site.url}/${o.type === "CHALLENGE" ? "challenges" : "opportunities"}/${o.id}?src=embed" target="_blank" rel="noopener">${xmlEscape(o.title)}</a><p>${xmlEscape(`${TYPE_LABEL[o.type]} · ${MODE[o.workMode]} · ${o.location}`)}</p><p>${xmlEscape(o.payText + (o.unpaid ? " (Unpaid)" : ""))} · Eligibility: ${xmlEscape(o.eligibility)}</p></li>`).join("");
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Open roles at ${xmlEscape(r.company.name)}</title><style>body{font-family:system-ui,sans-serif;margin:0;padding:16px;color:#111;background:#fff}h1{font-size:20px;margin:0 0 12px}ul{list-style:none;margin:0;padding:0}li{border:1px solid #ddd;border-radius:12px;padding:12px 14px;margin-bottom:10px}li a{font-weight:700;color:#0b57d0}li p{margin:4px 0 0;font-size:14px;color:#444}footer{font-size:12px;color:#555;margin-top:12px}</style></head><body><main><h1>Open roles at ${xmlEscape(r.company.name)}</h1>${items ? `<ul>${items}</ul>` : "<p>No open roles right now. Check back soon.</p>"}</main><footer>Powered by <a href="${site.url}" target="_blank" rel="noopener">Kalwings</a></footer></body></html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=60" } });
}
