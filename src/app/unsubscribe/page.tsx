import type { Metadata } from "next";
import { db } from "@/lib/db";
import { verifyUnsub } from "@/lib/unsub";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Email preferences", robots: { index: false } };
export const dynamic = "force-dynamic";

async function unsubscribe(fd: FormData) {
  "use server";
  const u = String(fd.get("u") ?? ""), t = String(fd.get("t") ?? "");
  if (!verifyUnsub(u, t)) return;
  await db.user.updateMany({ where: { id: u }, data: { emailNotifications: false } });
}

export default async function Page({ searchParams }: { searchParams: Promise<{ u?: string; t?: string; done?: string }> }) {
  const { u = "", t = "" } = await searchParams;
  const valid = !!u && !!t && verifyUnsub(u, t);
  const user = valid ? await db.user.findUnique({ where: { id: u }, select: { emailNotifications: true } }) : null;
  return (
    <div className="container max-w-lg py-24 text-center">
      <h1 className="text-3xl font-semibold">Email preferences</h1>
      {!user ? <p className="mt-4 text-ink-soft">This link isn&apos;t valid. You can change email settings any time under Notifications in your dashboard.</p>
        : !user.emailNotifications ? <p className="mt-4 text-ink-soft">You won&apos;t get notification emails from Kalwings. You can turn them back on under Notifications in your dashboard.</p>
        : (<><p className="mt-4 text-ink-soft">Stop emailing me about applications, sessions and messages? You&apos;ll still see them in your dashboard.</p>
          <form action={unsubscribe} className="mt-6"><input type="hidden" name="u" value={u} /><input type="hidden" name="t" value={t} /><Button size="lg">Turn off notification emails</Button></form></>)}
    </div>
  );
}
