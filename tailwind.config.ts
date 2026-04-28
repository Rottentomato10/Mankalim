import type { Config } from 'tailwindcss'
import rtl from 'tailwindcss-rtl'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#111318',
        foreground: '#e8e9ed',
        accent: '#0d9488',
        success: '#22c55e',
        error: '#f43f5e',
        glass: {
          DEFAULT: 'rgba(255, 255, 255, 0.04)',
          border: 'rgba(255, 255, 255, 0.06)',
        },
      },
      fontFamily: {
        sans: ['Heebo', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '14px',
        '3xl': '18px',
      },
    },
  },
  plugins: [rtl],
}

export default config
