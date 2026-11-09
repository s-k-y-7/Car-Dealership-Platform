/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FDF2F2',
          100: '#FDE8E8',
          200: '#FBD5D5',
          600: '#C81E1E',
          700: '#9B1C1C',
          800: '#771D1D',
          900: '#5F1414',
          accent: '#9E1B24',
          dark: '#0B0F19',
          charcoal: '#1A1E29',
          surface: '#F8F9FA',
          border: '#E5E7EB',
          subtle: '#64748B'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Cinzel', 'Playfair Display', 'Georgia', 'serif'],
      }
    },
  },
  plugins: [],
}
