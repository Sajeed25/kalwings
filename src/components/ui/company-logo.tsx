import { cn } from "@/lib/utils";

const FILLS = ["sticker-lilac", "sticker-sun", "sticker-mint", "sticker-primary", "bg-white text-[#111]"];
const hash = (s: string) => [...s].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7);

/** A company's uploaded logo, or a tidy monogram tile until they add one. Always the same square shape. */
/** Same hash-picked sticker colour for a name, used for monograms and photo-less people. */
export const tileFill = (name: string) => FILLS[hash(name) % FILLS.length];

export function CompanyLogo({ name, logoId, className }: { name: string; logoId?: string | null; className?: string }) {
  const initials = name.replace(/^sample\s+/i, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
  if (logoId) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={`/api/files/${logoId}`} alt={`${name} logo`} width={56} height={56} loading="lazy" className={cn("h-12 w-12 shrink-0 rounded-2xl bg-white object-contain p-1.5", className)} />;
  }
  return <span role="img" aria-label={`${name} logo placeholder`} className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-sm font-bold", FILLS[hash(name) % FILLS.length], className)}>{initials}</span>;
}
