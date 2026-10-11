/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#eef0f3',
        card: '#ffffff',
        ink: '#1c2128',
        line: '#d5dae2',
        muted: '#5c6570',
        link: '#1d4e89',
        pine: '#1f7a4d',
        amber: '#b86e00',
        signal: '#c2412a',
        navy: '#1a2332',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
