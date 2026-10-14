import Link from "next/link";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { publicMentors } from "@/lib/public-data";
import { SOURCE, mentorCommunity } from "@/data/robokalam";
import { MentorCard } from "@/components/home/mentor-wall";

export async function MentorWall() {
  const mentors = await publicMentors().then((r) => r.slice(0, 6)).catch(() => []);
  return (
    <section className="section">
      <div className="container">
        <Reveal className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="eyebrow">Mentor Wall</p>
            <h2 className="h-section mt-3">Learn from people who&apos;ve done it.</h2>
          </div>
          <Button asChild variant="secondary"><Link href="/mentors#become-a-mentor">Become a mentor</Link></Button>
        </Reveal>

        {mentors.length > 0 && (
          <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {mentors.map((m, i) => (<Reveal as="li" key={m.slug} delay={(i % 3) * 0.07}><MentorCard m={m} /></Reveal>))}
          </ul>
        )}

        <Reveal className="mt-12">
          <h3 className="text-xl">Our founding mentor community</h3>
          <p className="mt-1 text-sm text-ink-soft">Instructors and advisors from KodeZ by Robokalam. They join Kalwings as mentors once they complete verification. Source: <a className="underline" href={SOURCE.url} rel="noopener">{SOURCE.label}</a>.</p>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {mentorCommunity.map((m) => (
              <li key={m.name} className="card p-5">
                <span aria-hidden className="grid h-11 w-11 place-items-center rounded-full bg-black font-display font-bold text-white">{m.name[0]}</span>
                <p className="mt-3 font-semibold leading-snug">{m.name}</p><p className="text-sm text-ink-soft">{m.role}</p>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
