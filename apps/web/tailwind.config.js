/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        arkrec: {
          // 语义化色板,对齐 MediaWiki 经典色
          bg: "#FFFFFF",
          text: "#202122",
          ink: "#202122",
          muted: "#54595d",
          softInk: "#54595d",
          border: "#a2a9b1",
          rule: "#a2a9b1",
          primary: "#0645ad",
          link: "#0645ad",
          primaryHover: "#0b0080",
          linkHover: "#0b0080",
          panel: "#f8f9fa",
          header: "#eaecf0",
          sub: "#eaecf0",
          note: "#72777d",
          danger: "#d33",
          success: "#00af89",
        },
      },
      fontFamily: {
        sans: [
          "Noto Sans SC",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        serif: [
          "Noto Serif SC",
          "Songti SC",
          "STSong",
          "SimSun",
          "Times New Roman",
          "serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      borderRadius: {
        wiki: "2px",
      },
      boxShadow: {
        "wiki-card": "0 1px 2px rgba(0, 0, 0, 0.04)",
      },
    },
  },
  plugins: [],
};
