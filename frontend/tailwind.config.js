/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--color-bg)",
        surface: "var(--color-surface)",
        ink: "var(--color-ink)",
        accent: "var(--color-accent)",
        "accent-deep": "var(--color-accent-deep)",
        support: "var(--color-support)",
        line: "var(--color-line)",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        sans: ["var(--font-sans)"],
      },
      maxWidth: {
        content: "1280px",
      },
      spacing: {
        "safe-bottom": "env(safe-area-inset-bottom, 0px)",
      },
      boxShadow: {
        card: "0 1px 2px rgba(31, 46, 34, 0.06), 0 8px 24px rgba(31, 46, 34, 0.05)",
      },
    },
  },
  plugins: [],
};
