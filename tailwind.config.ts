import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
      boxShadow: {
        'card':       '0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.05)',
        'card-hover': '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
        'blue':       '0 4px 20px rgba(37,99,235,0.35)',
        'blue-lg':    '0 8px 32px rgba(37,99,235,0.40)',
        'mockup':     '0 24px 80px rgba(37,99,235,0.12), 0 8px 24px rgba(0,0,0,0.08)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-7px)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-5px)' },
        },
        'progress-fill': {
          '0%':   { strokeDasharray: '0 264' },
          '100%': { strokeDasharray: '248 264' },
        },
      },
      animation: {
        'float':         'float 3.5s ease-in-out infinite',
        'float-slow':    'float-slow 5s ease-in-out infinite',
        'progress-fill': 'progress-fill 1.4s ease-out forwards',
      },
    },
  },
  plugins: [],
} satisfies Config
