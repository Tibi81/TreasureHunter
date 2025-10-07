import { defineConfig } from '@tailwindcss/vite'

export default defineConfig({
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'halloween-orange': '#ff6b35',
        'halloween-purple': '#8b5cf6',
        'halloween-black': '#1a1a1a',
        'spooky-orange': '#ffa726',
        'spooky-purple': '#5b21b6',
      },
      fontFamily: {
        'halloween': ['Creepster', 'cursive'],
        'spooky': ['Fredoka', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'spin-slow': 'spin 3s linear infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      dropShadow: {
        'glow-orange': '0 0 6px rgba(255, 140, 0, 0.6)',
        'glow-purple': '0 0 6px rgba(139, 92, 246, 0.6)',
      }
    },
  },
})
