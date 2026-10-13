import { BadgeCheck, GitBranch, Trophy, QrCode } from "lucide-react";
import { LogoMark } from "@/components/ui/brand";
import { Badge, SampleTag } from "@/components/ui/badge";

/** Floating Talent Card mock-up. All content is illustrative (sample) and labelled as such. */
export function TalentCard() {
  return (
    <div className="relative mx-auto w-full max-w-[400px] animate-card-in">
      <div className="rounded-card-lg border border-line bg-surface p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="placeholder-img grid h-14 w-14 place-items-center rounded-lg font-display text-xl font-extrabold text-black dark:text-white">S</div>
            <div>
              <p className="font-display text-lg font-bold leading-tight">Sample Student</p>
              <p className="text-sm text-ink-soft">B.Tech ECE · Class of 2026</p>
            </div>
          </div>
          <LogoMark className="h-7 w-7" />
        </div>

        <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-ink-soft">Verified skills</p>
        <ul className="mt-2 space-y-2">
          {[["Embedded C", "Assessed · 82%"], ["Python", "Project evidence"], ["Circuit design", "Mentor-reviewed"]].map(([s, e]) => (
            <li key={s} className="flex items-center justify-between rounded-xl bg-muted px-3 py-2.5 text-sm">
              <span className="flex items-center gap-2 font-medium"><BadgeCheck className="h-4 w-4 text-accent" />{s}</span>
              <span className="text-ink-soft">{e}</span>
            </li>
          ))}
        </ul>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-line p-3">
            <Trophy className="h-4 w-4 text-spot" />
            <p className="mt-1.5 text-sm font-semibold leading-snug">Challenge finalist</p>
            <p className="text-xs text-ink-soft">Sample challenge</p>
          </div>
          <div className="rounded-xl border border-line p-3">
            <GitBranch className="h-4 w-4 text-accent" />
            <p className="mt-1.5 text-sm font-semibold leading-snug">3 projects</p>
            <p className="text-xs text-ink-soft">Code + demos</p>
          </div>
        </div>

        <blockquote className="mt-4 rounded-xl border-l-2 border-spot bg-spot/10 p-3 text-sm text-ink">
          “Methodical debugger. Shipped a working prototype in two weeks.”
          <footer className="mt-1 text-xs text-spot">— Sample Mentor, endorsement</footer>
        </blockquote>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-1.5"><SampleTag /><Badge>Contact private</Badge></div>
          <QrCode className="h-7 w-7 text-ink-soft" aria-label="QR code to the public Talent Card" />
        </div>
      </div>
    </div>
  );
}
