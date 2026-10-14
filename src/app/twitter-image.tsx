import { ImageResponse } from "next/og";

export const alt = "Kalwings — Your potential deserves to be seen.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#0B0E1A", color: "#fff", fontFamily: "sans-serif", borderTop: "8px solid #A0A8FF" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <svg width="64" height="78" viewBox="85 25 320 390" fill="none"><g stroke="#A0A8FF" strokeWidth="40" strokeLinecap="round" strokeLinejoin="round"><path d="M125 68V375"/><path d="M175 205L272 68"/><path d="M200 190L357 64"/><path d="M175 225L277 375"/><path d="M225 215L357 375"/></g><g fill="#A0A8FF"><circle cx="125" cy="68" r="30"/><circle cx="272" cy="68" r="30"/><circle cx="357" cy="64" r="30"/><circle cx="125" cy="375" r="30"/><circle cx="277" cy="375" r="30"/><circle cx="357" cy="375" r="30"/><circle cx="165" cy="215" r="38"/><circle cx="257" cy="218" r="11"/><rect x="277" y="175" width="20" height="87" rx="10"/><rect x="307" y="145" width="20" height="147" rx="10"/><rect x="337" y="120" width="20" height="198" rx="10"/><rect x="366" y="100" width="20" height="242" rx="10"/></g></svg>
          <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: 10 }}>KALWINGS</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", flexWrap: "wrap", fontSize: 80, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}><span>Your potential deserves to be</span><span style={{ color: "#A0A8FF", marginLeft: 20 }}>seen.</span></div>
          <div style={{ fontSize: 30, color: "#9CA3BD" }}>Build proof of your skills. Get hired by companies that value what you can do.</div>
        </div>
        <div style={{ fontSize: 24, color: "#9CA3BD" }}>kalwings.com · Incubated at T-Hub, Hyderabad</div>
      </div>
    ),
    size,
  );
}
