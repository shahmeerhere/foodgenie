/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./RecipeGeneratorApp.jsx", // Include the file name if it's in the root
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}