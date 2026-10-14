import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "1.5rem", screens: { "2xl": "1280px" } },
    extend: {
      colors: {
        // Semantic tokens → CSS variables (see globals.css). Dark/light swap happens there.
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        "ink-soft": "rgb(var(--ink-soft) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        primary: "rgb(var(--primary) / <alpha-value>)", // buttons and filled controls (dark text on top)
        "on-primary": "rgb(var(--on-primary) / <alpha-value>)",
        lilac: "rgb(var(--lilac) / <alpha-value>)", sun: "rgb(var(--sun) / <alpha-value>)", mint: "rgb(var(--mint) / <alpha-value>)", // soft sticker colours, always with dark text
        accent: "rgb(var(--accent) / <alpha-value>)", // brand blue-lavender (text-safe in both themes)
        danger: "rgb(var(--danger) / <alpha-value>)",
        spot: "rgb(var(--spot) / <alpha-value>)",     // brand purple (text-safe in both themes)
      },
      fontFamily: {
        // One family for everything. To change the brand font, edit src/app/layout.tsx (next/font) only.
        display: ["var(--font-brand)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-brand)", "system-ui", "sans-serif"],
        logo: ["var(--font-logo)", "var(--font-brand)", "system-ui", "sans-serif"],
      },
      borderRadius: { card: "20px", "card-lg": "28px" },
    },
  },
  plugins: [],
};
export default config;
