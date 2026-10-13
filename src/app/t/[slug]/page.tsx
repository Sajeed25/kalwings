import { permanentRedirect } from "next/navigation";

// Legacy Talent Card links keep working: they resolve to the Passport at /talent/<username or slug>.
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  permanentRedirect(`/talent/${slug}`);
}
