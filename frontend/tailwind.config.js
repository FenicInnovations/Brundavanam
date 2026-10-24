/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--color-bg-rgb) / <alpha-value>)",
        surface: "rgb(var(--color-surface-rgb) / <alpha-value>)",
        ink: "rgb(var(--color-ink-rgb) / <alpha-value>)",
        "ink-soft": "rgb(var(--color-ink-soft-rgb) / <alpha-value>)",
        accent: "rgb(var(--color-accent-rgb) / <alpha-value>)",
        "accent-deep": "rgb(var(--color-accent-deep-rgb) / <alpha-value>)",
        support: "rgb(var(--color-support-rgb) / <alpha-value>)",
        line: "rgb(var(--color-line-rgb) / <alpha-value>)",
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
