"use client";

// Last-resort boundary (replaces the root layout), so it can't rely on site styles.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#FAFAF7", color: "#0B1B3F", textAlign: "center", padding: "6rem 1.5rem" }}>
        <h1 style={{ fontSize: "2rem" }}>Something went wrong</h1>
        <p>Please try again in a moment.</p>
        <button onClick={reset} style={{ marginTop: "1.5rem", padding: ".75rem 1.5rem", borderRadius: 999, border: 0, background: "#0B1B3F", color: "#fff", fontWeight: 600, cursor: "pointer" }}>Try again</button>
      </body>
    </html>
  );
}
