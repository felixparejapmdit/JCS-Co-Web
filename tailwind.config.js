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
        // The accent scale. Electric Blue by default; a company with its own palette (Chemag) swaps
        // the values through CSS variables while someone is signed in to it (globals.css, shared/brands.ts).
        brand: Object.fromEntries([50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((k) => [k, `rgb(var(--brand-${k}) / <alpha-value>)`])),
        // Destructive actions: rose by default, Chemag red for Chemag.
        danger: Object.fromEntries([400, 500, 600].map((k) => [k, `rgb(var(--danger-${k}) / <alpha-value>)`])),
        // Dark surfaces, built on the dark theme's black #0e1416.
        ink: {
          950: '#0a0f11',
          900: '#0e1416',
          850: '#121a1d',
          800: '#172124',
          700: '#1d292d',
        },
        neon: {
          blue: 'rgb(var(--neon-1) / <alpha-value>)',
          green: 'rgb(var(--neon-2) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgb(var(--brand-500) / 0.35), 0 10px 32px -8px rgb(var(--brand-500) / 0.55)',
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
