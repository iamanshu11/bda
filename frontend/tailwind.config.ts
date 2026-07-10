import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './constants/**/*.{ts,tsx}',
    './frontend-data/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.5rem',
        lg: '2rem',
      },
      screens: {
        '2xl': '1280px',
      },
    },
    extend: {
      colors: {
        // Military-inspired brand palette
        navy: {
          50: '#eef3fb',
          100: '#d9e3f5',
          200: '#b3c6ea',
          300: '#7f9fd8',
          400: '#4a72bf',
          500: '#2b52a0',
          600: '#1d3d7f',
          700: '#153063',
          800: '#0e2450',
          900: '#0a1c3f',
          950: '#061128',
        },
        rust: {
          50: '#fdf4ec',
          100: '#f9e2cf',
          200: '#f0c199',
          300: '#e59a5f',
          400: '#d97a34',
          500: '#c05a17',
          600: '#a54912',
          700: '#843811',
          800: '#6b2f14',
          900: '#582814',
        },
        olive: {
          500: '#4b5320',
          600: '#3d431a',
        },
        // Semantic tokens (mapped to CSS variables for theming)
        background: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-alt': 'rgb(var(--surface-alt) / <alpha-value>)',
        foreground: 'rgb(var(--fg) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-heading)', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s ease-out forwards',
        'fade-in': 'fade-in 0.5s ease-out forwards',
        shimmer: 'shimmer 1.5s infinite',
      },
    },
  },
  plugins: [],
};

export default config;
