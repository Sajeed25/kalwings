import { ImageResponse } from "next/og";

export const alt = "Kalwings — Your potential deserves to be seen.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#0B1B3F", color: "#fff", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 40, fontWeight: 800 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg,#14B8A6,#38BDF8)" }} />
          Kalwings
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>Your potential deserves to be seen.</div>
          <div style={{ fontSize: 32, color: "#AAB8CD" }}>Build proof of your skills. Get hired by companies that value what you can do.</div>
        </div>
        <div style={{ fontSize: 26, color: "#38BDF8" }}>kalwings.com · Incubated at T-Hub, Hyderabad</div>
      </div>
    ),
    size,
  );
}
