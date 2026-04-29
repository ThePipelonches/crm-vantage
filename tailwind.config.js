/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0a",
        foreground: "#ffffff",

        card: "#111111",
        "card-foreground": "#ffffff",

        border: "#1f1f1f",
        input: "#1f1f1f",

        primary: "#22d3ee",
        secondary: "#1f1f1f",

        muted: "#2a2a2a",
        "muted-foreground": "#a1a1aa",

        accent: "#22d3ee",
        destructive: "#ef4444",
      },
    },
  },
  plugins: [],
};