import Link from "next/link";
import type { Role } from "@prisma/client";
import { MODULES } from "@/lib/modules";

/** Everything the signed-in role can do, in one place on the dashboard home. */
export function Workspace({ role }: { role: Role }) {
  return (
    <section aria-labelledby="ws-h" className="mt-10">
      <h2 id="ws-h" className="text-xl">Everything in your workspace</h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {MODULES[role].flatMap((s) => s.items.map((m) => ({ ...m, section: s.title }))).map((m) => (
          <li key={m.href} className="card card-hover flex flex-col p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">{m.section}</p>
            <Link href={m.href} className="mt-1 font-semibold hover:underline">{m.label}</Link>
            <p className="mt-1.5 text-sm text-ink-soft">{m.desc}</p>
            {m.tabs && <p className="mt-auto flex flex-wrap gap-x-4 pt-3 text-sm">{m.tabs.map((t) => <Link key={t.href} href={t.href} className="inline-block py-1.5 text-accent underline-offset-2 hover:underline">{t.label}</Link>)}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
