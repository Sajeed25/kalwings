"use client";

// Last-resort boundary (replaces the root layout), so it can't rely on site styles.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#000", color: "#fff", textAlign: "center", padding: "6rem 1.5rem" }}>
        <h1 style={{ fontSize: "2rem" }}>Something went wrong</h1>
        <p>Please try again in a moment.</p>
        <button onClick={reset} style={{ marginTop: "1.5rem", padding: ".75rem 1.5rem", borderRadius: 999, border: 0, background: "#10F27D", color: "#000", fontWeight: 600, cursor: "pointer" }}>Try again</button>
      </body>
    </html>
  );
}
