/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#090909',
        surface: '#111111',
        'surface-elevated': '#161616',
        ivory: '#F5F4F0',
        'ivory-muted': '#8E8D8A',
        'ivory-dim': '#4A4946',
        'brand-red': '#A62626',
        'brand-red-dark': '#7A1C1C',
      },
      fontFamily: {
        admin: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        editorial: ['"Bodoni Moda"', '"Playfair Display"', 'Didot', 'serif'],
        display: ['Syne', 'sans-serif'],
        sans: ['Inter', '"Space Grotesk"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
        hindi: ['"Cinzel Decorative"', '"Bodoni Moda"', 'serif']
      },
      letterSpacing: {
        tighter: '-0.06em',
        tight: '-0.04em',
        wide: '0.08em',
        wider: '0.15em',
        widest: '0.25em',
        ultra: '0.4em'
      }
    },
  },
  plugins: [],
}
