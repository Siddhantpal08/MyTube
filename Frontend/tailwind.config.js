/** @type {import('tailwindcss').Config} */
export default {
  // This array tells Tailwind to scan all .jsx files in your src folder
  content: [
    "./Frontend/index.html",
    "./Frontend/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}