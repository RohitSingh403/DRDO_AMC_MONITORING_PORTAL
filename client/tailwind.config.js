/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#f3efe6',
        card: '#fffdf8',
        ink: '#142033',
        navy: '#101a2b',
        brass: '#8d6a3f',
        line: '#e4d9c6',
        muted: '#6d6458',
        pine: '#1b7f4e',
        amber: '#c56a12',
        signal: '#b42318',
      },
      fontFamily: {
        sans: ['Outfit', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['"Source Serif 4"', 'ui-serif', 'Georgia', 'serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(20, 32, 51, 0.04), 0 12px 32px rgba(20, 32, 51, 0.05)',
      },
    },
  },
  plugins: [],
};
