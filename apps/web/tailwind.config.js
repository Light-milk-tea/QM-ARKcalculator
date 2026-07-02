/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        arkrec: {
          bg: "#FFFFFF",
          text: "#222222",
          muted: "#666666",
          border: "#DEDEDE",
          primary: "#0056b3",
          primaryHover: "#004494",
          panel: "#F8F9FA",
          danger: "#DC3545",
          success: "#28A745",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};