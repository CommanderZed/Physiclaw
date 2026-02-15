import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#001427",
          50: "#e6edf4",
          100: "#b3c7d9",
          200: "#0d2e4a",
          300: "#0a2540",
          400: "#071c33",
          500: "#001427",
          600: "#001020",
          700: "#000c18",
          800: "#000810",
          900: "#000408",
        },
        sage: {
          DEFAULT: "#708D81",
          light: "#8aa89b",
          dark: "#5a7268",
          dim: "#4a5f55",
        },
        gold: {
          DEFAULT: "#F4D58D",
          light: "#f7e2aa",
          dark: "#d4b46a",
          dim: "#b89a50",
        },
        crimson: {
          DEFAULT: "#BF0603",
          light: "#d93835",
          dark: "#8D0801",
        },
      },
      fontFamily: {
        mono: ["var(--font-geist-mono)", "monospace"],
        sans: ["var(--font-geist-sans)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
