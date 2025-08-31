/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#002147',
        },
        emerald: {
          DEFAULT: '#2E7D32',
        },
        gold: {
          DEFAULT: '#C9A635',
        },
        gray: {
          50: '#F5F5F5',
          900: '#333333',
        },
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
        roboto: ['Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
