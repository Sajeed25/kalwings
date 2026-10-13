import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "1.5rem", screens: { "2xl": "1200px" } },
    extend: {
      colors: {
        // Semantic tokens → CSS variables (see globals.css). Light/dark swap happens there.
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        "ink-soft": "rgb(var(--ink-soft) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        // Brand constants
        navy: { DEFAULT: "#0B1B3F", 900: "#060F26", 800: "#0B1B3F", 700: "#14295A" },
        teal: { DEFAULT: "#14B8A6", 600: "#0D9488", 700: "#0F766E" },
        sky: { DEFAULT: "#38BDF8", 600: "#0284C7" },
        saffron: { DEFAULT: "#F59E0B", 700: "#B45309", 50: "#FFFBEB" },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      borderRadius: { card: "20px", "card-lg": "24px" },
      boxShadow: {
        card: "0 1px 2px rgb(11 27 63 / 0.04), 0 12px 32px -12px rgb(11 27 63 / 0.10)",
        lift: "0 2px 4px rgb(11 27 63 / 0.05), 0 28px 56px -16px rgb(11 27 63 / 0.22)",
        glow: "0 20px 60px -20px rgb(20 184 166 / 0.55)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(120deg, #14B8A6 0%, #38BDF8 100%)",
      },
      keyframes: {
        marquee: { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } },
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-10px)" } },
        "card-in": { from: { opacity: "0", transform: "translateY(32px) rotate(2deg)" }, to: { opacity: "1", transform: "none" } },
      },
      animation: {
        marquee: "marquee 40s linear infinite",
        float: "float 7s ease-in-out infinite",
        "card-in": "card-in .9s .15s cubic-bezier(.21,.6,.35,1) both",
      },
    },
  },
  plugins: [],
};
export default config;
