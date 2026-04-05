import type { Config } from "tailwindcss";

const config: Partial<Config> = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#6C5CE7",
          dark: "#4A3ABA",
          light: "#A29BFE",
        },
        accent: {
          teal: "#00CEC9",
          coral: "#FF6B6B",
          amber: "#FDCB6E",
          mint: "#55EFC4",
        },
        surface: {
          DEFAULT: "#1A1A2E",
          light: "#252542",
          dark: "#0F0F1A",
        },
        border: {
          DEFAULT: "#2D2D4A",
          light: "#E8E8F0",
        },
        text: {
          primary: "#FFFFFF",
          secondary: "#B0B0CC",
          muted: "#6C6C8A",
        },
        // Light mode overrides
        light: {
          bg: "#F8F9FE",
          surface: "#FFFFFF",
          border: "#E8E8F0",
          text: "#1A1A2E",
          "text-secondary": "#6C6C8A",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        heading: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "16px",
        button: "12px",
        pill: "999px",
      },
      boxShadow: {
        glow: "0 8px 32px rgba(108, 92, 231, 0.15)",
        "glow-lg": "0 12px 48px rgba(108, 92, 231, 0.25)",
        card: "0 4px 16px rgba(0, 0, 0, 0.2)",
      },
      backdropBlur: {
        glass: "16px",
      },
    },
  },
};

export default config;
