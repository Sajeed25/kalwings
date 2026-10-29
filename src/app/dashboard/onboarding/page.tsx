import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/session";
import { Wizard } from "./wizard";
import { safeNext } from "@/lib/next-path";

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next) ?? undefined;
  const u = await requirePageRole("STUDENT");
  const p = await db.studentProfile.findUniqueOrThrow({ where: { userId: u.id }, include: { projects: true } });
  if (p.headline && p.projects.length) redirect(next ?? "/dashboard");
  return <Wizard name={u.name} hasProfile={!!p.headline} next={next} />;
}
