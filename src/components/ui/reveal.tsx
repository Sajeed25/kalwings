import { cn } from "@/lib/utils";

/**
 * Fade-and-rise on scroll. Pure CSS (see globals.css) toggled by the single <RevealObserver /> in the layout,
 * so it costs no per-element JavaScript. Content is fully visible without JS or with reduced motion.
 */
export function Reveal({ children, delay = 0, className, as = "div" }: { children: React.ReactNode; delay?: number; className?: string; as?: "div" | "li" }) {
  const Comp = as;
  return <Comp className={cn("reveal", className)} style={delay ? { transitionDelay: `${delay}s` } : undefined}>{children}</Comp>;
}
