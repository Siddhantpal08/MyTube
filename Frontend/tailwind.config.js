/** @type {import('tailwindcss').Config} */
export default {
  // This tells Tailwind to scan all your component and HTML files for classes.
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [],
}