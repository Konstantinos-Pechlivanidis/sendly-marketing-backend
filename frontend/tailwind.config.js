/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary Colors
        'primary-dark': '#020202',
        'primary-light': '#E5E5E5',
        
        // Ice Accent Colors
        'ice-accent': '#99B5D7',
        'ice-light': '#B3CDDA',
        'ice-dark': '#6686A9',
        
        // Border / Subtle Lines
        'border-subtle': '#94A9B4',
        
        // Zoom Fuchsia Colors
        'zoom-fuchsia': '#C09DAE',
        'zoom-fuchsia-deep': '#7C5A67',
        
        // Surface Colors
        'surface-dark': '#191819',
        'surface-mid': '#262425',
        
        // Background Colors
        'bg-dark': '#020202',
        'bg-light': '#E5E5E5',
        
        // Glass Colors (with transparency - used in CSS)
        'glass-white': 'rgba(255, 255, 255, 0.10)',
        'glass-dark': 'rgba(2, 2, 2, 0.30)',
        'glass-ice': 'rgba(153, 181, 215, 0.20)',
        'glass-fuchsia': 'rgba(192, 157, 174, 0.22)',
        'glass-border': 'rgba(148, 169, 180, 0.30)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"SF Mono"', 'Monaco', 'Menlo', 'Inconsolata', 'monospace'],
      },
      fontSize: {
        'hero': ['3.0rem', { lineHeight: '1.1' }],
        'h1': ['2.25rem', { lineHeight: '1.2' }],
        'h2': ['1.875rem', { lineHeight: '1.3' }],
        'h3': ['1.5rem', { lineHeight: '1.3' }],
        'body': ['1rem', { lineHeight: '1.5' }],
        'small': ['0.75rem', { lineHeight: '1.4' }],
      },
      spacing: {
        '0': '0px',
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
        '20': '80px',
        '24': '96px',
      },
      borderRadius: {
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        '2xl': '24px',
        '3xl': '32px',
        'full': '9999px',
      },
      boxShadow: {
        'sm': '0 1px 2px rgba(0,0,0,0.05)',
        'md': '0 4px 6px rgba(0,0,0,0.10)',
        'lg': '0 10px 15px rgba(0,0,0,0.10)',
        'xl': '0 20px 25px rgba(0,0,0,0.10)',
        'glass': '0 8px 32px rgba(2, 2, 2, 0.37)',
        'glass-lg': '0 16px 48px rgba(2, 2, 2, 0.50)',
        'glow-ice': '0 0 20px rgba(153, 181, 215, 0.40)',
        'glow-ice-lg': '0 0 30px rgba(153, 181, 215, 0.50)',
        'glow-fuchsia': '0 0 24px rgba(192, 157, 174, 0.50)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'glass-shimmer': 'glassShimmer 3s ease-in-out infinite',
        'glass-glow': 'glassGlow 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        glassShimmer: {
          '0%, 100%': { opacity: '0.8' },
          '50%': { opacity: '1' },
        },
        glassGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(153, 181, 215, 0.40)' },
          '50%': { boxShadow: '0 0 30px rgba(153, 181, 215, 0.60)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      screens: {
        'mobile': { 'max': '767px' },
        'tablet': { 'min': '768px', 'max': '1279px' },
        'desktop': { 'min': '1280px' },
      },
    },
  },
  plugins: [],
}

