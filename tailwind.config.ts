import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Martial arts dark theme
        brand: {
          red: "#c0392b",
          "red-dark": "#922b21",
          "red-light": "#e74c3c",
          gold: "#d4ac0d",
          "gold-light": "#f1c40f",
          dark: "#0d0d0d",
          surface: "#161616",
          card: "#1e1e1e",
          border: "#2a2a2a",
          muted: "#6b6b6b",
        },
        // Belt colors
        belt: {
          white: "#f0f0f0",
          yellow: "#f1c40f",
          orange: "#e67e22",
          green: "#27ae60",
          blue: "#2980b9",
          purple: "#8e44ad",
          brown: "#6d4c41",
          red: "#c0392b",
          black: "#111111",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};

export default config;
