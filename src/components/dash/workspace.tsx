import Link from "next/link";
import type { Role } from "@prisma/client";
import { MODULES } from "@/lib/modules";
import { ModuleIcon } from "@/components/dash/icons";

const TILE = ["sticker-lilac", "sticker-sun", "sticker-mint", "sticker-primary"];

/** Everything the signed-in role can do, in one place on the dashboard home. */
export function Workspace({ role }: { role: Role }) {
  const items = MODULES[role].flatMap((s) => s.items.map((m) => ({ ...m, section: s.title })));
  return (
    <section aria-labelledby="ws-h" className="mt-12">
      <h2 id="ws-h" className="text-2xl font-bold">Everything in your <span className="serif-accent text-[1.12em]">workspace</span></h2>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {items.map((m, i) => (
          <li key={m.href} className="card card-hover flex flex-col p-6">
            <span className={`grid h-11 w-11 place-items-center rounded-2xl ${TILE[i % TILE.length]}`}><ModuleIcon name={m.icon} className="h-5 w-5" /></span>
            <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft">{m.section}</p>
            <Link href={m.href} className="mt-1 text-lg font-bold hover:underline">{m.label}</Link>
            <p className="mt-1.5 text-sm text-ink-soft">{m.desc}</p>
            {m.tabs && <p className="mt-auto flex flex-wrap gap-x-4 pt-4 text-sm">{m.tabs.map((t) => <Link key={t.href} href={t.href} className="inline-block py-1.5 font-medium text-accent underline-offset-2 hover:underline">{t.label}</Link>)}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
