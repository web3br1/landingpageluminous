/** @type {import('tailwindcss').Config} */

// Import design system colors from JS file
const colors = require("./design-system/colors.js");

const config = {
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: Object.fromEntries(
          Object.entries(colors.primary).map(([key, value]) => [
            key,
            `hsl(${value})`,
          ]),
        ),
        secondary: Object.fromEntries(
          Object.entries(colors.secondary).map(([key, value]) => [
            key,
            `hsl(${value})`,
          ]),
        ),
        accent: Object.fromEntries(
          Object.entries(colors.accent).map(([key, value]) => [
            key,
            `hsl(${value})`,
          ]),
        ),
        neutral: Object.fromEntries(
          Object.entries(colors.neutral).map(([key, value]) => [
            key,
            `hsl(${value})`,
          ]),
        ),
        success: `hsl(${colors.success.DEFAULT})`,
        warning: `hsl(${colors.warning.DEFAULT})`,
        destructive: `hsl(${colors.destructive.DEFAULT})`,
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
};

export default config;
