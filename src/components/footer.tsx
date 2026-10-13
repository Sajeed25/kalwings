import Link from "next/link";
import { Github, Instagram, Linkedin, Youtube } from "lucide-react";
import { Logo } from "@/components/ui/wing";

const cols = [
  { title: "Product", links: [["Opportunities", "/opportunities"], ["Challenges", "/challenges"], ["Mentors", "/mentors"], ["Community", "/community"]] },
  { title: "Audiences", links: [["For Students", "/students"], ["For Employers", "/employers"], ["For Colleges", "/colleges"], ["Become a mentor", "/mentors#become-a-mentor"]] },
  { title: "Company", links: [["About", "/about"], ["Careers", "/about#careers"], ["Press", "/press"], ["Contact", "/contact"], ["Help Centre", "/help"]] },
  { title: "Legal", links: [["Privacy", "/privacy"], ["Terms", "/terms"], ["Trust & Safety", "/trust"]] },
];

// Replace "#" with real profile URLs.
const social = [
  { label: "LinkedIn", Icon: Linkedin, href: "#" },
  { label: "Instagram", Icon: Instagram, href: "#" },
  { label: "YouTube", Icon: Youtube, href: "#" },
  { label: "GitHub", Icon: Github, href: "#" },
];

export function Footer() {
  return (
    <footer className="on-navy bg-navy text-white">
      <div className="container py-16">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <Logo onDark />
            <p className="mt-4 max-w-xs text-[15px] text-white/70">Your potential deserves to be seen.</p>
            <ul className="mt-6 flex gap-2">
              {social.map(({ label, Icon, href }) => (
                <li key={label}>
                  <a href={href} aria-label={label} className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-white/80 transition hover:bg-white/10 hover:text-white"><Icon className="h-[18px] w-[18px]" /></a>
                </li>
              ))}
            </ul>
          </div>
          {cols.map((c) => (
            <nav key={c.title} aria-label={c.title} className="md:col-span-2">
              <h2 className="font-sans text-sm font-semibold tracking-normal text-white">{c.title}</h2>
              <ul className="mt-4 space-y-2.5">
                {c.links.map(([l, h]) => (
                  <li key={l}><Link href={h} className="text-[15px] text-white/70 transition hover:text-white">{l}</Link></li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-14 flex flex-col gap-2 border-t border-white/10 pt-6 text-sm text-white/60 md:flex-row md:justify-between">
          <p>Made in Telangana, India. Built for the world.</p>
          <p>© {new Date().getFullYear()} Kalwings. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
