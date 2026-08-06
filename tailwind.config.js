/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: {
      colors: {
        // Identité RentEasy — "brand" (tanzanite, bleu-violet profond) porte la confiance et la
        // structure de l'app (nav, boutons, liens) ; "accent" (corail) porte les actions (CTA,
        // montants, alertes positives), en contraste chaud face au brand froid.
        brand: {
          50: '#f4f2fe', 100: '#e9e5fd', 200: '#d3cbfb', 300: '#b3a5f7', 400: '#8f76f0',
          500: '#5d3fd3', 600: '#4d2fc0', 700: '#3e239b', 800: '#331e7d', 900: '#2b1a65',
        },
        accent: {
          50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 300: '#fdba74', 400: '#fb923c',
          500: '#f97316', 600: '#ea580c', 700: '#c2410c', 800: '#9a3412', 900: '#7c2d12',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(43,26,101,0.06), 0 8px 24px -8px rgba(43,26,101,0.12)',
      },
    },
  },
  plugins: [],
}
