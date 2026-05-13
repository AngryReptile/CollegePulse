/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Glass palette — dark tints on light (inverted from white tints on dark)
        glass: {
          50:  'rgba(0,0,0,0.04)',
          100: 'rgba(0,0,0,0.07)',
          200: 'rgba(0,0,0,0.10)',
          300: 'rgba(0,0,0,0.15)',
          400: 'rgba(0,0,0,0.22)',
        },
        // Brand — was blue, now amber
        brand: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#d97706',
          600: '#b45309',
          700: '#92400e',
          800: '#78350f',
          900: '#451a03',
        },
        // Accent — was purple/violet, now deep orange
        violet: {
          400: '#fb923c',
          500: '#ea580c',
          600: '#c2410c',
        },
        // Accent — was pink/rose, now teal/cyan
        rose: {
          400: '#22d3ee',
          500: '#06b6d4',
        },
        // Surface — was near-black, now near-white lavender
        surface: {
          900: '#f5f4ff',
          800: '#eceaff',
          700: '#e3e0ff',
          600: '#d8d4ff',
          500: '#ccc6ff',
        },
        border: {
          DEFAULT: 'rgba(0,0,0,0.08)',
          bright:  'rgba(0,0,0,0.16)',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-glow':       'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(217,119,6,0.25) 0%, transparent 70%)',
        'glass-shine':     'linear-gradient(135deg, rgba(0,0,0,0.06) 0%, transparent 60%)',
        'brand-gradient':  'linear-gradient(135deg, #d97706 0%, #c2410c 100%)',
        'rose-gradient':   'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
        'cyan-gradient':   'linear-gradient(135deg, #db2777 0%, #be185d 100%)',
        'green-gradient':  'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
      },
      boxShadow: {
        'glass':       '0 4px 24px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.6)',
        'glass-lg':    '0 8px 40px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.8)',
        'glow-brand':  '0 0 20px rgba(217,119,6,0.35)',
        'glow-violet': '0 0 20px rgba(194,65,12,0.35)',
        'glow-rose':   '0 0 20px rgba(8,145,178,0.35)',
        'dock':        '0 8px 32px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.04)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'float':      'float 6s ease-in-out infinite',
        'shimmer':    'shimmer 2s linear infinite',
        'spin-slow':  'spin 8s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':       { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backdropBlur: { xs: '4px' },
      borderRadius: {
        '2.5xl': '20px',
        '3xl':   '24px',
      },
    },
  },
  plugins: [],
}
