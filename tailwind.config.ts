import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        jobsite: {
          ink: "#171717",
          steel: "#5f6368",
          rail: "#dedede",
          paper: "#f4f4f4",
          safety: "#f96302",
          pine: "#00873c",
          black: "#1b1b1b",
          amber: "#fff7ed"
        }
      },
      boxShadow: {
        toolbar: "0 10px 30px rgba(31, 37, 32, 0.12)"
      },
      keyframes: {
        "cart-bump": {
          "0%": { transform: "scale(1)" },
          "35%": { transform: "scale(1.16) translateY(-2px)" },
          "70%": { transform: "scale(0.96)" },
          "100%": { transform: "scale(1)" }
        },
        "cart-badge": {
          "0%": { transform: "scale(1)" },
          "45%": { transform: "scale(1.35)" },
          "100%": { transform: "scale(1)" }
        }
      },
      animation: {
        "cart-bump": "cart-bump 650ms ease-out",
        "cart-badge": "cart-badge 650ms ease-out"
      }
    }
  },
  plugins: []
};

export default config;
