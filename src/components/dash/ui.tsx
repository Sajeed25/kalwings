import { cn } from "@/lib/utils";

export function Panel({ title, children, className, action }: { title?: string; children: React.ReactNode; className?: string; action?: React.ReactNode }) {
  return (
    <section className={cn("card p-6 md:p-7", className)}>
      {(title || action) && <div className="mb-4 flex items-center justify-between gap-3">{title && <h2 className="text-lg font-bold">{title}</h2>}{action}</div>}
      {children}
    </section>
  );
}

export function PageTitle({ title, sub }: { title: React.ReactNode; sub?: string }) {
  return <div className="mb-8"><h1 className="text-3xl font-bold md:text-4xl">{title}</h1>{sub && <p className="mt-2 max-w-2xl text-ink-soft">{sub}</p>}</div>;
}

export { Serif } from "@/components/ui/serif";

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-ink-soft">{children}</p>;
}

const statTone = { plain: "card", lilac: "rounded-card sticker-lilac", sun: "rounded-card sticker-sun", mint: "rounded-card sticker-mint", primary: "rounded-card sticker-primary" } as const;
export function Stat({ label, value, tone = "plain" }: { label: string; value: React.ReactNode; tone?: keyof typeof statTone }) {
  return <div className={cn(statTone[tone], "flex flex-col justify-between gap-6 p-6")}><p className={cn("text-sm font-medium", tone === "plain" ? "text-ink-soft" : "opacity-90")}>{label}</p><p className="font-display text-5xl font-bold tracking-tight">{value}</p></div>;
}

const tone: Record<string, string> = {
  VERIFIED: "bg-mint text-[#07140d]", PENDING: "bg-sun text-[#1c1708]", REJECTED: "bg-danger/20 text-danger",
};
export function Status({ s }: { s: string }) {
  return <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", tone[s] ?? "bg-muted text-ink-soft")}>{s.replace("_", " ").toLowerCase()}</span>;
}

export const fmt = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
export const fmtTime = (d: Date) => d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
