import { ImageResponse } from "next/og";

const SIZES = new Set([192, 512]);

/** PNG app icons for the PWA manifest (192 and 512). Black tile with the brand mark, in the maskable safe zone. */
export async function GET(_: Request, { params }: { params: Promise<{ size: string }> }) {
  const n = Number((await params).size);
  if (!SIZES.has(n)) return new Response("Not found", { status: 404 });
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#000" }}><svg width={n * 0.5} height={n * 0.6} viewBox="85 25 320 390" fill="none"><defs><linearGradient id="g" gradientUnits="userSpaceOnUse" x1="0" y1="30" x2="0" y2="405"><stop offset="0" stopColor="#0DF27A"/><stop offset=".48" stopColor="#14E58A"/><stop offset=".72" stopColor="#3F9AB6"/><stop offset=".92" stopColor="#7C2FF6"/><stop offset="1" stopColor="#7C2FF6"/></linearGradient></defs><g stroke="url(#g)" strokeWidth="40" strokeLinecap="round" strokeLinejoin="round"><path d="M125 68V375"/><path d="M175 205L272 68"/><path d="M200 190L357 64"/><path d="M175 225L277 375"/><path d="M225 215L357 375"/></g><g fill="url(#g)"><circle cx="125" cy="68" r="30"/><circle cx="272" cy="68" r="30"/><circle cx="357" cy="64" r="30"/><circle cx="125" cy="375" r="30"/><circle cx="277" cy="375" r="30"/><circle cx="357" cy="375" r="30"/><circle cx="165" cy="215" r="38"/><circle cx="257" cy="218" r="11"/><rect x="277" y="175" width="20" height="87" rx="10"/><rect x="307" y="145" width="20" height="147" rx="10"/><rect x="337" y="120" width="20" height="198" rx="10"/><rect x="366" y="100" width="20" height="242" rx="10"/></g></svg></div>
    ),
    { width: n, height: n },
  );
}
