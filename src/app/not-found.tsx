import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container py-32 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-3 text-5xl font-semibold">This page took flight.</h1>
      <p className="mt-3 text-ink-soft">We couldn&apos;t find what you were looking for.</p>
      <Button asChild size="lg" className="mt-8"><Link href="/">Back home</Link></Button>
    </div>
  );
}
