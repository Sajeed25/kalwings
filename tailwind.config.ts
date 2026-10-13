import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "1.5rem", screens: { "2xl": "1200px" } },
    extend: {
      colors: {
        // Semantic tokens → CSS variables (see globals.css). Dark/light swap happens there.
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        "ink-soft": "rgb(var(--ink-soft) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)", // brand green (text-safe in both themes)
        danger: "rgb(var(--danger) / <alpha-value>)",
        spot: "rgb(var(--spot) / <alpha-value>)",     // brand purple (text-safe in both themes)
        purple: "rgb(var(--purple) / <alpha-value>)", // brand purple for graphics / buttons
        // Fixed brand colours (logo)
        neon: "#10F27D",
        violet: "#7C2FF6",
      },
      fontFamily: {
        // One family for everything. To change the brand font, edit src/app/layout.tsx (next/font) only.
        display: ["var(--font-brand)", "system-ui", "sans-serif"],
        sans: ["var(--font-brand)", "system-ui", "sans-serif"],
      },
      borderRadius: { card: "12px", "card-lg": "16px" },
      keyframes: {
        marquee: { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } },
        "card-in": { from: { opacity: "0", transform: "translateY(24px)" }, to: { opacity: "1", transform: "none" } },
      },
      animation: {
        marquee: "marquee 40s linear infinite",
        "card-in": ".7s .1s cubic-bezier(.21,.6,.35,1) both card-in",
      },
    },
  },
  plugins: [],
};
export default config;
