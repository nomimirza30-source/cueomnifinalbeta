/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'snooker-table': '#1a472a',
        'snooker-cushion': '#0d2b1a',
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
