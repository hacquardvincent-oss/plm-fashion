/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#f8f5f0',
        gold: {
          DEFAULT: '#b8860b',
          light: '#d4a017',
          dark: '#8a6508',
          muted: '#e8d5a3',
          subtle: '#fdf6e3',
        },
        dark: {
          DEFAULT: '#0f0e0c',
          lighter: '#2a2826',
        },
      },
      fontFamily: {
        serif: ['"DM Serif Display"', 'Georgia', 'serif'],
        sans: ['Outfit', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(15 14 12 / 0.05), 0 1px 2px -1px rgb(15 14 12 / 0.05)',
        'card-hover': '0 4px 12px 0 rgb(15 14 12 / 0.08)',
      },
    },
  },
  plugins: [],
}
