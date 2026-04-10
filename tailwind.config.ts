import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Neutral base + one accent (warm amber) for premium minimal look
        ink: {
          50: "#f8f8f7",
          100: "#efeeec",
          200: "#d9d7d2",
          300: "#b8b5ad",
          400: "#8e8a80",
          500: "#6a665c",
          600: "#4a4740",
          700: "#33312c",
          800: "#1f1e1a",
          900: "#131210",
        },
        accent: {
          DEFAULT: "#d97706",
          hover: "#b45309",
          soft: "#fef3c7",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      container: {
        center: true,
        padding: {
          DEFAULT: "1rem",
          sm: "1.5rem",
          lg: "2rem",
        },
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
