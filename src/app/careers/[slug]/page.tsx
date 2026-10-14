import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Block } from "@/components/pages/shell";
import { CareerList } from "@/components/pages/career-list";
import { SampleTag } from "@/components/ui/badge";
import { careerPage } from "@/lib/careers";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const r = await careerPage((await params).slug);
  return r ? { title: `Careers at ${r.company.name}`, description: `Open roles at ${r.company.name}, a verified employer on Kalwings.`, robots: r.company.isSample ? { index: false } : undefined } : { title: "Careers" };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const r = await careerPage(slug);
  if (!r) notFound();
  const { company, jobs } = r;
  const ld = { "@context": "https://schema.org", "@type": "Organization", name: company.name, url: company.website ?? undefined, sameAs: company.website ? [company.website] : undefined, description: company.about ?? undefined };
  return (
    <Block>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <div className="max-w-3xl">
        <div className="flex gap-2">{company.isSample && <SampleTag />}</div>
        <h1 className="mt-3 text-4xl font-semibold md:text-5xl">Careers at {company.name}</h1>
        <p className="mt-2 text-ink-soft">Verified employer ✓ · {jobs.length} open {jobs.length === 1 ? "role" : "roles"}</p>
        {company.about && <p className="mt-4 whitespace-pre-line">{company.about}</p>}
        {company.website && <p className="mt-2 text-sm"><a className="font-semibold text-accent underline" href={company.website} rel="noopener nofollow">{company.website}</a></p>}
        <div className="mt-8"><CareerList company={company} jobs={jobs} /></div>
        <p className="mt-8 text-xs text-ink-soft">Hosted by <a className="underline" href={site.url}>Kalwings</a>. Applying doesn&apos;t guarantee an interview or offer.</p>
      </div>
    </Block>
  );
}
