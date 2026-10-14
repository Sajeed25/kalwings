import { feedJobs, jobUrl } from "@/lib/distribution";
import { asList } from "@/lib/lists";
import { TYPE_LABEL } from "@/lib/opportunity-types";

export const dynamic = "force-dynamic";

export async function GET() {
  const jobs = await feedJobs();
  const body = { publisher: "Kalwings", generatedAt: new Date().toISOString(), jobs: jobs.map((o) => ({ id: o.id, title: o.title, company: o.company.name, type: TYPE_LABEL[o.type], workMode: o.workMode, location: o.location, pay: o.payText, unpaid: o.unpaid, eligibility: o.eligibility, skills: asList(o.skills), description: o.description, postedAt: o.createdAt.toISOString(), validThrough: o.deadline.toISOString(), url: jobUrl(o.id, "feed") })) };
  return Response.json(body, { headers: { "cache-control": "public, max-age=300" } });
}
