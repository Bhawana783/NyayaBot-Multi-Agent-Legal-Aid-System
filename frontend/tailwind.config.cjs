module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: {
          light: '#FAFAFA',
          dark: '#0D0D0D',
        },
        surface: {
          light: '#FFFFFF',
          dark: '#141414',
        },
        border: {
          light: '#E5E5E5',
          dark: '#262626',
        },
        accent: {
          light: '#1A1A1A',
          dark: '#FFFFFF',
        },
        // New professional colors for legal authority
        primary: '#1A237E', // Deep Navy
        secondary: '#2E7D32', // Emerald Green
        muted: '#6B6B6B',
        success: '#059669',
        processing: '#2563EB',
        warning: '#D97706',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      fontSize: {
        base: '14px',
      },
      keyframes: {
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
      animation: {
        'pulse-subtle': 'pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
