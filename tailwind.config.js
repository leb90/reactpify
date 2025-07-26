/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/components/**/*.liquid',
    './sections/**/*.liquid',
    './layout/*.liquid',
    './src/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/utils/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'reactpify-primary': 'var(--reactpify-primary)',
        'reactpify-secondary': 'var(--reactpify-secondary)',
        'reactpify-accent': 'var(--reactpify-accent)',
        'reactpify-background': 'var(--reactpify-background)',
        'reactpify-text': 'var(--reactpify-text)',
        'reactpify-border': 'var(--reactpify-border)',
        'reactpify-success': 'var(--reactpify-success)',
        'reactpify-warning': 'var(--reactpify-warning)',
        'reactpify-error': 'var(--reactpify-error)',
      },
      spacing: {
        'reactpify-xs': 'var(--reactpify-spacing-xs)',
        'reactpify-sm': 'var(--reactpify-spacing-sm)',
        'reactpify-md': 'var(--reactpify-spacing-md)',
        'reactpify-lg': 'var(--reactpify-spacing-lg)',
        'reactpify-xl': 'var(--reactpify-spacing-xl)',
      },
      borderRadius: {
        'reactpify': 'var(--reactpify-border-radius)',
        'reactpify-sm': 'var(--reactpify-border-radius-sm)',
        'reactpify-lg': 'var(--reactpify-border-radius-lg)',
      },
      fontFamily: {
        'reactpify': 'var(--reactpify-font-family)',
        'reactpify-heading': 'var(--reactpify-font-family-heading)',
      },
      fontSize: {
        'reactpify-xs': 'var(--reactpify-font-size-xs)',
        'reactpify-sm': 'var(--reactpify-font-size-sm)',
        'reactpify-base': 'var(--reactpify-font-size-base)',
        'reactpify-lg': 'var(--reactpify-font-size-lg)',
        'reactpify-xl': 'var(--reactpify-font-size-xl)',
        'reactpify-2xl': 'var(--reactpify-font-size-2xl)',
        'reactpify-3xl': 'var(--reactpify-font-size-3xl)',
      },
      boxShadow: {
        'reactpify': 'var(--reactpify-shadow)',
        'reactpify-sm': 'var(--reactpify-shadow-sm)',
        'reactpify-lg': 'var(--reactpify-shadow-lg)',
      },
      animation: {
        'reactpify-fade-in': 'reactpify-fade-in 0.3s ease-out',
        'reactpify-slide-in': 'reactpify-slide-in 0.3s ease-out',
        'reactpify-bounce': 'reactpify-bounce 0.6s ease-in-out',
        'reactpify-pulse': 'reactpify-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'reactpify-fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'reactpify-slide-in': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'reactpify-bounce': {
          '0%, 100%': { transform: 'translateY(-25%)', animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)' },
          '50%': { transform: 'translateY(0)', animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)' },
        },
        'reactpify-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  },
  important: '[data-component-root]',
  safelist: [
    'reactpify-component',
    'reactpify-container',
    'reactpify-card',
    'reactpify-btn',
    'reactpify-glassmorphism',
    {
      pattern: /reactpify-.*/,
      variants: ['hover', 'focus', 'active'],
    },
    {
      pattern: /(bg|text|border)-(red|green|blue|yellow|purple|pink|indigo|gray)-(100|200|300|400|500|600|700|800|900)/,
      variants: ['hover', 'focus'],
    },
    {
      pattern: /animate-(ping|pulse|bounce|spin)/,
    },
  ],
}; 