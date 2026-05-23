/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          DEFAULT: '#041632',
          container: '#1b2b48',
          fixed: '#d7e2ff',
          'fixed-dim': '#b7c7eb',
        },
        secondary: {
          DEFAULT: '#bb0015',
          container: '#e32027',
          fixed: '#ffdad6',
          'fixed-dim': '#ffb4ac',
        },
        tertiary: {
          DEFAULT: '#00182e',
          container: '#142d45',
          fixed: '#d1e4ff',
          'fixed-dim': '#b1c9e8',
        },
        background: '#f8f9ff',
        surface: {
          DEFAULT: '#f8f9ff',
          dim: '#cbdbf5',
          'container-lowest': '#ffffff',
          'container-low': '#eff4ff',
          'container': '#e5eeff',
          'container-high': '#dce9ff',
          'container-highest': '#d3e4fe',
        },
        on: {
          background: '#0b1c30',
          surface: {
            DEFAULT: '#0b1c30',
            variant: '#44474d',
          },
          primary: {
            DEFAULT: '#ffffff',
            fixed: '#091b37',
            'fixed-variant': '#374765',
          },
          secondary: {
            DEFAULT: '#ffffff',
            fixed: '#410003',
            'fixed-variant': '#93000e',
          },
          tertiary: {
            DEFAULT: '#ffffff',
            fixed: '#011d35',
            'fixed-variant': '#314862',
          },
        },
        outline: {
          DEFAULT: '#75777e',
          variant: '#c5c6ce',
        },
        error: {
          DEFAULT: '#ba1a1a',
          container: '#ffdad6',
        },
        accent: {
          500: '#8b5cf6',
          600: '#7c3aed',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 4px 24px rgba(0,0,0,0.06)',
        card: '0 8px 32px rgba(99,102,241,0.08)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        shimmer: 'shimmer 1.4s linear infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        slideUp: { '0%': { transform: 'translateY(12px)', opacity: 0 }, '100%': { transform: 'translateY(0)', opacity: 1 } },
        shimmer: { '0%': { backgroundPosition: '-400px 0' }, '100%': { backgroundPosition: '400px 0' } },
      },
    },
  },
  plugins: [],
};
