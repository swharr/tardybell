/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        garden: {
          50: '#f0f5f1',
          100: '#dce8de',
          200: '#b8d1bc',
          300: '#8db896',
          400: '#6a9e73',
          500: '#4a7c59',
          600: '#3b6347',
          700: '#2d4a36',
          800: '#1f3225',
          900: '#111a14',
        },
        gold: {
          50: '#fef8eb',
          100: '#fdecc8',
          200: '#fbd98f',
          300: '#f9c456',
          400: '#f9a620',
          500: '#e08c0a',
          600: '#b86d08',
          700: '#8a5006',
          800: '#5c3504',
          900: '#2e1a02',
        },
        berry: {
          50: '#fdf2f2',
          100: '#fbe1e1',
          200: '#f5baba',
          300: '#e88a8a',
          400: '#d45a5a',
          500: '#b7472a',
          600: '#993a22',
          700: '#742c1a',
          800: '#4f1e12',
          900: '#2a100a',
        },
        parchment: {
          50: '#fdfcfa',
          100: '#f9f7f2',
          200: '#f5f3ed',
          300: '#ebe7db',
          400: '#d9d3c3',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Source Sans 3"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
