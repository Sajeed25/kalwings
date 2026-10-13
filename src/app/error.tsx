"use client";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container py-32 text-center">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="mt-3 text-4xl font-extrabold">We hit a snag.</h1>
      <p className="mt-3 text-ink-soft">The team has been told. Please try again.{error.digest && <span className="block text-xs">Reference: {error.digest}</span>}</p>
      <Button size="lg" className="mt-8" onClick={reset}>Try again</Button>
    </div>
  );
}
