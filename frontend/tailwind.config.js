/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // MediSphere AI Modern Clinical Healthcare Palette
        brand: {
          50:  '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',  // Primary Clinical Sky/Cyan
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        // Status Colors
        critical: '#ef4444',
        warning:  '#f59e0b',
        success:  '#10b981',
        info:     '#0ea5e9',
        // Modern Clinical Slate Surfaces
        surface: {
          50:  '#1e293b',
          100: '#0f172a',
          200: '#0c1322',
          300: '#0a0f1d',
          400: '#060913',
        },
        // Elevated Glass Card Surfaces
        card: {
          DEFAULT: 'rgba(15, 23, 42, 0.82)',
          hover:   'rgba(30, 41, 59, 0.92)',
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-outfit)', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'mesh-gradient': 'linear-gradient(135deg, #0284c7 0%, #0f766e 100%)',
        'brand-gradient': 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 45%, #6366f1 100%)',
        'dark-gradient': 'linear-gradient(180deg, #0f172a 0%, #0a0f1d 100%)',
        'glass-gradient': 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.0) 100%)',
      },
      boxShadow: {
        'glow-brand': '0 0 30px rgba(14, 165, 233, 0.3)',
        'glow-critical': '0 0 30px rgba(239, 68, 68, 0.3)',
        'glow-success': '0 0 30px rgba(16, 185, 129, 0.3)',
        'card': '0 8px 32px rgba(0, 0, 0, 0.45)',
        'card-hover': '0 12px 48px rgba(0, 0, 0, 0.65)',
        'glass-inset': 'inset 0 1px 1px rgba(255, 255, 255, 0.12)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
        'spin-slow': 'spin 3s linear infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':       { transform: 'translateY(-10px)' },
        },
        slideIn: {
          '0%':   { transform: 'translateX(-20px)', opacity: 0 },
          '100%': { transform: 'translateX(0)',     opacity: 1 },
        },
        fadeIn: {
          '0%':   { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
