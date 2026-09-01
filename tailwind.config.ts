import type { Config } from "tailwindcss";

/**
 * One palette, one typeface. Hierarchy comes from weight and size rather than
 * from more colours or more fonts — brass marks what matters (the clock, the
 * choice in front of the player), red is kept for things that are actually
 * urgent.
 */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0B0D12",
          panel: "#151922",
          /** One step up from a panel, for a row that sits on top of one. */
          raised: "#1B2029",
        },
        body: {
          DEFAULT: "#F2F3F5",
          muted: "#9298A5",
          /** For text that is present but deliberately receded. */
          faint: "#5D6472",
        },
        brass: {
          DEFAULT: "#C8A96B",
          dim: "#8A754A",
        },
        alert: "#C94B4B",
        affirm: "#6FA88A",
        line: {
          DEFAULT: "rgba(242, 243, 245, 0.08)",
          strong: "rgba(242, 243, 245, 0.16)",
        },
      },
      fontFamily: {
        sans: ['"Noto Sans JP"', "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        /** Clock, dates and Latin labels only — never Japanese body text. */
        figure: ['"Inter"', "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      letterSpacing: {
        label: "0.18em",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "sheet-up": {
          from: { opacity: "0", transform: "translateY(24px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        caret: {
          "0%, 45%": { opacity: "1" },
          "50%, 95%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 320ms cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fade-in 260ms ease-out both",
        "fade-in-slow": "fade-in 900ms ease-out both",
        "sheet-up": "sheet-up 280ms cubic-bezier(0.22, 1, 0.36, 1) both",
        caret: "caret 1.1s step-end infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
