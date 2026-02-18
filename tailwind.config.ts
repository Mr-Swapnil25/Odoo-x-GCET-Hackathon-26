import type { Config } from 'tailwindcss';

export default {
  content: [
    './index.html',
    './components/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
    './*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'primary': '#4848e5',
        'cosmic-black': '#050810',
        'electric-indigo': '#4F46E5',
        'neon-cyan': '#06B6D4',
        'alert-red': '#F43F5E',
        'background-light': '#f6f6f8',
        'background-dark': '#050810',
      },
      fontFamily: {
        'display': ['Space Grotesk', 'sans-serif'],
        'body': ['Noto Sans', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'DEFAULT': '1rem',
        'lg': '2rem',
        'xl': '3rem',
        'full': '9999px',
      },
      backgroundImage: {
        'grid-pattern': 'radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
      },
      keyframes: {
        pulseglow: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(244, 63, 94, 0.2), inset 0 0 10px rgba(244, 63, 94, 0.1)' },
          '50%': { boxShadow: '0 0 25px rgba(244, 63, 94, 0.5), inset 0 0 20px rgba(244, 63, 94, 0.2)' },
        },
        aurora: {
          '0%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0, 0) scale(1)' },
        },
        typewriter: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        }
      },
      animation: {
        'pulse-glow': 'pulseglow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'aurora-move': 'aurora 10s ease-in-out infinite',
        'cursor-blink': 'typewriter 1s step-end infinite',
      }
    },
  },
  plugins: [],
} satisfies Config;
