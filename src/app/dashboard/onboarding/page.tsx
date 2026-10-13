import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/session";
import { Wizard } from "./wizard";

export default async function Page() {
  const u = await requirePageRole("STUDENT");
  const p = await db.studentProfile.findUniqueOrThrow({ where: { userId: u.id }, include: { projects: true } });
  if (p.headline && p.projects.length) redirect("/dashboard");
  return <Wizard name={u.name} hasProfile={!!p.headline} />;
}
