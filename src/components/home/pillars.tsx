import Link from "next/link";
import { ArrowUpRight, Award, Briefcase, MessagesSquare, Rocket, Users, UserSquare2 } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";

const tiles = [
  { Icon: Users, t: "Mentor Network", d: "Book office hours with people who've shipped products, built labs and hired teams across India, Germany, Saudi Arabia and beyond.", href: "/mentors", cls: "md:col-span-4 md:row-span-2", dark: true },
  { Icon: UserSquare2, t: "Proof-of-Skill Profile", d: "Projects, assessed skills, challenge results and mentor endorsements — in one shareable Talent Card. Contact details stay private until you say so.", href: "/students", cls: "md:col-span-2 md:row-span-2", dark: false, feature: true },
  { Icon: Briefcase, t: "Opportunity Marketplace", d: "Internships, jobs and challenges with pay, work mode and eligibility always shown.", href: "/opportunities", cls: "md:col-span-2" },
  { Icon: Award, t: "Recruiter Hiring Studio", d: "Search, shortlist and run a pipeline from Applied to Offer.", href: "/employers", cls: "md:col-span-2" },
  { Icon: MessagesSquare, t: "The Community", d: "College chapters, study groups and builders helping builders.", href: "/community", cls: "md:col-span-2" },
  { Icon: Rocket, t: "Challenge-to-Hire (Novathon)", d: "Solve a real company problem. The best work earns an interview.", href: "/challenges", cls: "md:col-span-6" },
];

type Tile = (typeof tiles)[number] & { dark?: boolean; feature?: boolean };

export function Pillars() {
  return (
    <section className="section">
      <div className="container">
        <Reveal className="max-w-2xl">
          <p className="eyebrow">Six pillars</p>
          <h2 className="h-section mt-3">One platform. Everything a fresher needs to be seen.</h2>
        </Reveal>
        <div className="mt-14 grid gap-5 md:grid-cols-6 md:auto-rows-[minmax(150px,auto)]">
          {(tiles as Tile[]).map((t, i) => (
            <Reveal key={t.t} delay={i * 0.05} className={t.cls}>
              <Link href={t.href} className={cn("card card-hover group relative flex h-full flex-col justify-between overflow-hidden p-7 md:p-8", t.dark && "on-navy border-transparent bg-navy text-white")}>
                {t.dark && <div aria-hidden className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-brand-gradient opacity-25 blur-3xl" />}
                <div className="relative">
                  <span className={cn("grid h-11 w-11 place-items-center rounded-xl", t.dark ? "bg-white/10" : "bg-muted")}><t.Icon className="h-5 w-5" /></span>
                  <h3 className={cn("mt-5", t.dark || t.feature ? "text-3xl" : "text-xl")}>{t.t}</h3>
                  <p className={cn("mt-2 max-w-md text-[15px]", t.dark ? "text-white/75" : "text-ink-soft")}>{t.d}</p>
                </div>
                <ArrowUpRight className="relative mt-6 h-5 w-5 self-end opacity-60 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" aria-hidden />
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
