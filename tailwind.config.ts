import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        industrial: {
          ink: "#111111",
          steel: "#5c5a54",
          muted: "#7c786f",
          rail: "#d8d3ca",
          paper: "#f3f0e9",
          pine: "#2f6f4e",
          amber: "#eee6d8",
          red: "#b42318"
        },
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
      fontFamily: {
        sans: ["var(--truewerk-font)"]
      },
      borderRadius: {
        card: "0.5rem",
        chip: "0.25rem"
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
        },
        "heart-save": {
          "0%": { transform: "scale(1)", filter: "drop-shadow(0 0 0 rgba(220,38,38,0))" },
          "28%": { transform: "scale(1.38)", filter: "drop-shadow(0 0 8px rgba(220,38,38,0.35))" },
          "52%": { transform: "scale(0.9)", filter: "drop-shadow(0 0 4px rgba(220,38,38,0.25))" },
          "76%": { transform: "scale(1.14)", filter: "drop-shadow(0 0 6px rgba(220,38,38,0.3))" },
          "100%": { transform: "scale(1)", filter: "drop-shadow(0 0 0 rgba(220,38,38,0))" }
        },
        "image-fade": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        }
      },
      animation: {
        "cart-bump": "cart-bump 650ms ease-out",
        "cart-badge": "cart-badge 650ms ease-out",
        "button-confirm": "button-confirm 520ms ease-out both",
        "heart-save": "heart-save 720ms ease-out both",
        "image-fade": "image-fade 200ms ease-out"
      }
    }
  },
  plugins: []
};

export default config;
