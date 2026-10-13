import Link from "next/link";
import { MapPin, Search, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TalentCard } from "./talent-card";

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-20 pt-12 md:pb-28 md:pt-20">
      <div aria-hidden className="grid-bg pointer-events-none absolute inset-0 -z-10 [mask-image:linear-gradient(to_bottom,black,transparent_80%)]" />
      <div className="container grid items-center gap-16 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="inline-flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">
            <span className="h-2 w-2 rounded-sm bg-accent" />
            Incubated at T-Hub Hyderabad · 2024
          </p>
          <h1 className="h-display mt-6">Your potential deserves to be <span className="text-accent">seen.</span></h1>
          <p className="mt-6 max-w-xl text-lg text-ink-soft md:text-xl">
            Build proof of your skills, learn from industry mentors, and get hired by companies that value what you can do.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg"><Link href="/join">Build my profile <ArrowRight className="h-4 w-4" /></Link></Button>
            <Button asChild size="lg" variant="secondary"><Link href="/employers">Hire freshers</Link></Button>
          </div>

          <form action="/opportunities" role="search" className="card mt-10 flex max-w-2xl flex-col gap-2 p-2 sm:flex-row sm:items-center">
            <label className="flex flex-1 items-center gap-2 px-3">
              <Search className="h-4 w-4 shrink-0 text-ink-soft" aria-hidden />
              <span className="sr-only">Role, skill or company</span>
              <input name="q" placeholder="Role, skill or company" className="h-11 w-full bg-transparent text-[15px] placeholder:text-ink-soft focus:outline-none" />
            </label>
            <span className="hidden h-6 w-px bg-line sm:block" aria-hidden />
            <label className="flex flex-1 items-center gap-2 px-3">
              <MapPin className="h-4 w-4 shrink-0 text-ink-soft" aria-hidden />
              <span className="sr-only">Location or remote</span>
              <input name="location" placeholder="Location or Remote" className="h-11 w-full bg-transparent text-[15px] placeholder:text-ink-soft focus:outline-none" />
            </label>
            <Button type="submit" className="sm:ml-1">Search</Button>
          </form>
        </div>
        <div className="lg:col-span-5"><TalentCard /></div>
      </div>
    </section>
  );
}
