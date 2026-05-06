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
          ink: "#111111",
          steel: "#5c5a54",
          rail: "#d8d3ca",
          paper: "#f3f0e9",
          safety: "#111111",
          pine: "#2f6f4e",
          black: "#111111",
          amber: "#eee6d8"
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
        },
        "button-confirm": {
          "0%": { transform: "scale(1)", boxShadow: "inset 0 0 0 0 rgba(255,255,255,0)" },
          "35%": { transform: "scale(0.98)", boxShadow: "inset 0 -52px 0 0 rgba(47,111,78,0.96)" },
          "100%": { transform: "scale(1)", boxShadow: "inset 0 -52px 0 0 rgba(47,111,78,0.96)" }
        }
      },
      animation: {
        "cart-bump": "cart-bump 650ms ease-out",
        "cart-badge": "cart-badge 650ms ease-out",
        "button-confirm": "button-confirm 520ms ease-out both"
      }
    }
  },
  plugins: []
};

export default config;
