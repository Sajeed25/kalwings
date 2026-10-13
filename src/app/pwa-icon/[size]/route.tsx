import { ImageResponse } from "next/og";

const SIZES = new Set([192, 512]);

/** PNG app icons for the PWA manifest (192 and 512). Navy tile with the gradient wing, in the maskable safe zone. */
export async function GET(_: Request, { params }: { params: Promise<{ size: string }> }) {
  const n = Number((await params).size);
  if (!SIZES.has(n)) return new Response("Not found", { status: 404 });
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#0B1B3F" }}>
        <svg width={n * 0.5} height={n * 0.5} viewBox="0 0 48 48">
          <defs><linearGradient id="g" x1="4" y1="44" x2="44" y2="4" gradientUnits="userSpaceOnUse"><stop stopColor="#14B8A6" /><stop offset="1" stopColor="#38BDF8" /></linearGradient></defs>
          <path d="M6 40C14 38 22 32 28 22c2-3 4-8 4-14 6 4 8 12 5 19-4 8-14 13-31 13Z" fill="url(#g)" />
        </svg>
      </div>
    ),
    { width: n, height: n },
  );
}
