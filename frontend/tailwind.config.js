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
        /*
          Custom keyframes for animated gradient background
          - Adjust colors and stops to match brand palette
          - Animation speed can be changed in index.css
        */
        keyframes: {
          'gradient-shift': {
            '0%': {
              'background-position': '0% 50%',
              'background': 'linear-gradient(120deg, #003366 0%, #2E8B57 50%, #F5F5F5 100%)',
            },
            '50%': {
              'background-position': '100% 50%',
              'background': 'linear-gradient(120deg, #2E8B57 0%, #D4AF37 50%, #003366 100%)',
            },
            '100%': {
              'background-position': '0% 50%',
              'background': 'linear-gradient(120deg, #003366 0%, #2E8B57 50%, #F5F5F5 100%)',
            },
          },
        },
        animation: {
          'gradient-shift': 'gradient-shift 16s ease-in-out infinite',
        },
    },
  },
  plugins: [],
}
