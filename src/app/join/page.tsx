import type { Metadata } from "next";
import { AuthCard } from "@/components/pages/auth-card";

export const metadata: Metadata = { title: "Join Kalwings", robots: { index: false } };

export default async function Page({ searchParams }: { searchParams: Promise<{ role?: string; error?: string }> }) {
  const sp = await searchParams;
  return <AuthCard mode="join" initialRole={(sp.role ?? "").toUpperCase()} errorCode={sp.error} />;
}
