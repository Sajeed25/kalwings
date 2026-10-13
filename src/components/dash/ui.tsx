import { cn } from "@/lib/utils";

export function Panel({ title, children, className, action }: { title?: string; children: React.ReactNode; className?: string; action?: React.ReactNode }) {
  return (
    <section className={cn("card p-6", className)}>
      {(title || action) && <div className="mb-4 flex items-center justify-between gap-3">{title && <h2 className="text-xl">{title}</h2>}{action}</div>}
      {children}
    </section>
  );
}

export function PageTitle({ title, sub }: { title: string; sub?: string }) {
  return <div className="mb-8"><h1 className="text-3xl font-extrabold md:text-4xl">{title}</h1>{sub && <p className="mt-1 text-ink-soft">{sub}</p>}</div>;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-ink-soft">{children}</p>;
}

export function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="card p-5"><p className="text-sm text-ink-soft">{label}</p><p className="mt-1 font-display text-3xl font-extrabold">{value}</p></div>;
}

const tone: Record<string, string> = {
  VERIFIED: "bg-teal/15 text-teal-700 dark:text-teal", PENDING: "bg-saffron-50 text-saffron-700 dark:bg-saffron/15 dark:text-saffron", REJECTED: "bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200",
};
export function Status({ s }: { s: string }) {
  return <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", tone[s] ?? "bg-muted text-ink-soft")}>{s.replace("_", " ").toLowerCase()}</span>;
}

export const fmt = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
export const fmtTime = (d: Date) => d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
