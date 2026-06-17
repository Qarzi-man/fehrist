/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:      { DEFAULT: '#0d0d1a', card: '#151526', elevated: '#1c1c35' },
        primary: { DEFAULT: '#7c6ff7', hover: '#6a5ef0', light: '#a89cf9' },
        danger:  { DEFAULT: '#f05252', hover: '#e03e3e' },
        success: { DEFAULT: '#22c55e', hover: '#16a34a' },
        warn:    { DEFAULT: '#f59e0b' },
        border:  { DEFAULT: '#2a2a45' },
        muted:   { DEFAULT: '#6b6b8a' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
