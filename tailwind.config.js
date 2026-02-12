/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3DDBB8',
          hover: '#2DB89D',
          light: '#E0F7F3',
          dark: '#1A9B7F',
        },
        mint: {
          50: '#F0F9F7',
          100: '#E8F5F1',
          200: '#E0F7F3',
        },
      },
    },
  },
  plugins: [],
};
