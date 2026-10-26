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
        brand: {
          50: "#fff8eb",
          100: "#ffefc6",
          200: "#ffdd88",
          300: "#ffc54a",
          400: "#ffad20",
          500: "#f98b07",
          600: "#dd6602",
          700: "#b74606",
          800: "#94360c",
          900: "#7a2d0d",
          950: "#461502",
        },
        slate: {
          850: "#172033",
          925: "#0c1322",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
