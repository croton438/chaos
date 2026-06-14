/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        chaos: {
          black: "#050507",
          panel: "#0d0d12",
          line: "#24242d",
          violet: "#8b5cf6",
          cyan: "#22d3ee"
        }
      },
      boxShadow: {
        neon: "0 0 35px rgba(139, 92, 246, 0.25)",
        cyan: "0 0 28px rgba(34, 211, 238, 0.2)"
      }
    }
  },
  plugins: []
};

