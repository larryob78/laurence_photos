import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#05050a",
        surface: "#0a0a12",
        border: "#181828",
        text: "#c8c8e0",
        bright: "#eeeeff",
        dim: "#444460",
        accent: "#00ff88",
        alert: "#ff3366",
        data: "#4488ff",
        warning: "#ffcc00",
        infra: "#aa66ff",
        trust: "#ff8800",
      },
      fontFamily: {
        syne: ["Syne", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
