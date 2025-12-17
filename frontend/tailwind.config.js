/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}", // For backward compatibility during refactor
  ],
  theme: {
    extend: {
      colors: {
        space: {
          black: '#050714',
          navy: '#0a0f29',
          panel: 'rgba(10, 15, 41, 0.7)'
        },
        accent: {
          cyan: 'var(--color-accent-cyan)',
          phosphor: 'var(--color-accent-phosphor)',
          purple: 'var(--color-accent-purple)',
          orange: 'var(--color-accent-orange)',
          red: 'var(--color-accent-red)'
        },
        ui: {
          border: 'rgba(255, 255, 255, 0.1)',
          text: '#e2e8f0',
          dim: '#94a3b8'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Space Mono', 'monospace'],
        display: ['Orbitron', 'sans-serif']
      },
      animation: {
        'spin-slow': 'spin 8s linear infinite',
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'signal-pulse': 'signal-pulse 1.5s ease-in-out infinite'
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 },
        },
        'signal-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(6, 182, 212, 0.4)' },
          '70%': { boxShadow: '0 0 0 10px rgba(6, 182, 212, 0)' },
        }
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)",
        'vignette': 'radial-gradient(circle at center, transparent 0%, rgba(5, 7, 20, 0.8) 100%)'
      }
    },
  },
  plugins: [],
}
