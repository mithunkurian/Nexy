import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        nexy: {
          50:  "#f0f4ff",
          100: "#dde7ff",
          200: "#c0cfff",
          300: "#93aaff",
          400: "#607bff",
          500: "#3b52ff",
          600: "#2030f5",
          700: "#1a24e0",
          800: "#1a21b5",
          900: "#1c238e",
          950: "#111355",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
