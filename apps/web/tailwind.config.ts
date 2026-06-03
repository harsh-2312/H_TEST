import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "#0b1120",
        muted: "#7d8ba9",
        accent: "#7c3aed"
      },
      boxShadow: {
        soft: "0 25px 50px -12px rgba(15, 23, 42, 0.35)"
      }
    }
  },
  plugins: []
};

export default config;
