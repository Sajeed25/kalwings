import type { Metadata } from "next";
import { Announcement } from "@/components/dash/announcement";
import { AuthCard } from "@/components/pages/auth-card";

export const metadata: Metadata = { title: "Join Kalwings", robots: { index: false } };

export default async function Page({ searchParams }: { searchParams: Promise<{ role?: string; error?: string }> }) {
  const sp = await searchParams;
  return <><Announcement /><AuthCard mode="join" initialRole={(sp.role ?? "").toUpperCase()} errorCode={sp.error} googleEnabled={!!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET} /></>;
}
