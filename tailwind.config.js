/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        mongo: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#00ED64', // Official MongoDB Green
          600: '#00684A', // Official MongoDB Dark Green
          700: '#023430', // Official MongoDB Deep Forest Slate
          800: '#001E2B', // Official MongoDB Deep Slate / Navy
          900: '#00141e',
          950: '#000c14',
        }
      },
      fontFamily: {
        mono: ['Fira Code', 'Consolas', 'Monaco', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif']
      }
    },
  },
  plugins: [],
}
