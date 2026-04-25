/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#FF8A00',
          yellow: '#FFC700',
        }
      }
    },
  },
  plugins: [],
}
