/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: '#07070a',
          900: '#0b0c10',
          800: '#15161e',
          700: '#1f212d',
          600: '#2b2e3c',
          500: '#484c5f',
        },
        cyber: {
          indigo: '#5e43f3',
          purple: '#9d4edd',
          pink: '#f72585',
          emerald: '#10b981',
          cyan: '#06b6d4',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'glass-sm': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-glow': '0 0 30px 0 rgba(94, 67, 243, 0.15)',
        'emerald-glow': '0 0 30px 0 rgba(16, 185, 129, 0.15)'
      }
    },
  },
  plugins: [],
}
