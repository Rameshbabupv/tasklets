/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: "#667eea",
        "primary-dark": "#764ba2",
        "spark-purple": "#667eea",
        "spark-violet": "#764ba2",
        "spark-yellow": "#fbbf24",
        "spark-cyan": "#06b6d4",
        "spark-pink": "#f43f5e",
        "background-light": "#fafbfc",
      },
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
        display: ["Lexend Deca", "DM Sans", "sans-serif"],
      },
      backgroundImage: {
        'gradient-spark': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'gradient-spark-radial': 'radial-gradient(circle at top right, #667eea, #764ba2)',
        'gradient-shimmer': 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
    },
  },
  plugins: [],
}
