import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

const paths = ["", "/opportunities", "/mentors", "/challenges", "/community", "/students", "/employers", "/colleges", "/about", "/press", "/contact", "/help", "/privacy", "/terms", "/trust"];
// Sample mentor/opportunity detail pages are noindex and intentionally excluded until real data exists.
export default function sitemap(): MetadataRoute.Sitemap {
  return paths.map((p) => ({ url: `${site.url}${p}`, changeFrequency: "weekly", priority: p === "" ? 1 : 0.7 }));
}
