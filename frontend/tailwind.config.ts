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
        'call-ping': {
          '0%': { transform: 'scale(1)', opacity: '0.7' },
          '75%, 100%': { transform: 'scale(1.85)', opacity: '0' },
        },
        'call-blink': {
          '0%, 100%': { opacity: '0.35', transform: 'scale(1)' },
          '50%': { opacity: '0.85', transform: 'scale(1.08)' },
        },
        'call-wiggle': {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '15%': { transform: 'rotate(-12deg)' },
          '30%': { transform: 'rotate(12deg)' },
          '45%': { transform: 'rotate(-8deg)' },
          '60%': { transform: 'rotate(8deg)' },
          '75%': { transform: 'rotate(0deg)' },
        },
        'intro-logo': {
          '0%': { opacity: '0', transform: 'scale(0.7)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'intro-word': {
          '0%': { opacity: '0', transform: 'translateY(28px) scale(0.92)', letterSpacing: '0.4em', filter: 'blur(6px)' },
          '60%': { opacity: '1', filter: 'blur(0)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)', letterSpacing: '0.18em', filter: 'blur(0)' },
        },
        'intro-exit': {
          '0%': { opacity: '1', transform: 'translateY(0) scale(1)' },
          '100%': { opacity: '0', transform: 'translateY(-6%) scale(1.04)' },
        },
        'loader-word': {
          '0%, 8%': { opacity: '0', transform: 'translateY(10px)' },
          '18%, 30%': { opacity: '1', transform: 'translateY(0)' },
          '40%, 100%': { opacity: '0', transform: 'translateY(-8px)' },
        },
        'loader-pulse': {
          '0%, 100%': { opacity: '0.35', transform: 'scale(0.98)' },
          '50%': { opacity: '1', transform: 'scale(1)' },
        },
        'loader-bar': {
          '0%': { transform: 'translateX(-120%)' },
          '100%': { transform: 'translateX(220%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s ease-out forwards',
        'fade-in': 'fade-in 0.5s ease-out forwards',
        shimmer: 'shimmer 1.5s infinite',
        'call-ping': 'call-ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite',
        'call-blink': 'call-blink 1.4s ease-in-out infinite',
        'call-wiggle': 'call-wiggle 2.4s ease-in-out infinite',
        'intro-logo': 'intro-logo 0.55s ease-out forwards',
        'intro-word': 'intro-word 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'intro-exit': 'intro-exit 0.6s ease-in forwards',
        'loader-word': 'loader-word 3.3s ease-in-out infinite',
        'loader-pulse': 'loader-pulse 1.6s ease-in-out infinite',
        'loader-bar': 'loader-bar 1.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
