/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#06b6d4', // cyan-500
        accent: '#fbbf24',  // amber-400
        bgDark: '#0f172a',  // slate-900
      },
    },
  },
  plugins: [], // Add this if missing
}