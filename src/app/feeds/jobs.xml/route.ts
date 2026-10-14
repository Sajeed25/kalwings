import { cdata, feedJobs, jobUrl, xmlEscape } from "@/lib/distribution";
import { TYPE_LABEL } from "@/lib/opportunity-types";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

/** Indeed-style XML job feed of verified, moderated, open, non-sample listings. Job aggregators must approve a feed before they ingest it. */
export async function GET() {
  const jobs = await feedJobs();
  const items = jobs.map((o) => `  <job>
    <title>${cdata(o.title)}</title>
    <date>${cdata(o.createdAt.toUTCString())}</date>
    <referencenumber>${cdata(o.id)}</referencenumber>
    <url>${cdata(jobUrl(o.id, "feed"))}</url>
    <company>${cdata(o.company.name)}</company>
    <city>${cdata(o.location)}</city>
    <country>${cdata("IN")}</country>
    <description>${cdata(o.description)}</description>
    <salary>${cdata(o.payText + (o.unpaid ? " (Unpaid)" : ""))}</salary>
    <jobtype>${cdata(TYPE_LABEL[o.type])}</jobtype>
    <expirationdate>${cdata(o.deadline.toUTCString())}</expirationdate>
  </job>`).join("\n");
  const xml = `<?xml version="1.0" encoding="utf-8"?>\n<source>\n  <publisher>Kalwings</publisher>\n  <publisherurl>${xmlEscape(site.url)}</publisherurl>\n  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n${items}\n</source>\n`;
  return new Response(xml, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=300" } });
}
