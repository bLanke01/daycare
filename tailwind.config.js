/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4CAF50',    // Green
        secondary: '#2196F3',  // Blue
        accent: '#FF9800',     // Orange
        neutral: '#333333',    // Dark Gray
        'base-100': '#FFFFFF', // White
        info: '#03A9F4',       // Light Blue
        success: '#4CAF50',    // Green
        warning: '#FFC107',    // Amber
        error: '#F44336',      // Red
      },
    },
  },
  daisyui: {
    themes: ["light", "dark"],
    base: true,
    styled: true,
    utils: true,
    prefix: "",
    logs: true,
    themeRoot: ":root",
  },
  plugins: [require("daisyui")],
}