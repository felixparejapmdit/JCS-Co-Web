/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Electric Blue: the Cloud AOS accent.
        brand: {
          50: '#eef6ff',
          100: '#d9eaff',
          200: '#bcdbff',
          300: '#8ec4ff',
          400: '#59a2ff',
          500: '#2f7fff',
          600: '#1a62f5',
          700: '#144de1',
          800: '#173fb6',
          900: '#19388f',
          950: '#142357',
        },
        // Deep slate grays used on true-black surfaces.
        ink: {
          950: '#000000',
          900: '#07080a',
          850: '#0c0d10',
          800: '#121317',
          700: '#1a1c21',
        },
        neon: {
          blue: '#3d8bff',
          green: '#19e6a0',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(47,127,255,0.35), 0 10px 32px -8px rgba(47,127,255,0.55)',
        'glow-green': '0 0 0 1px rgba(16,185,129,0.35), 0 10px 32px -8px rgba(16,185,129,0.45)',
        lift: '0 18px 40px -18px rgba(15,23,42,0.35)',
      },
      borderRadius: {
        '2xl': '1.125rem',
        '3xl': '1.5rem',
      },
      keyframes: {
        // Transform only: fading a blurred (glass) surface makes its blur pop in at the end.
        rise: { '0%': { transform: 'translateY(10px) scale(0.985)' }, '100%': { transform: 'translateY(0) scale(1)' } },
      },
      animation: {
        rise: 'rise 0.22s cubic-bezier(0.2, 0.8, 0.2, 1) both',
      },
    },
  },
  plugins: [],
};
