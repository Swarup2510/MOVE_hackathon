/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0c",
        panel: "rgba(20, 20, 25, 0.7)",
        primary: "#3b82f6",
        secondary: "#10b981",
        accent: "#f59e0b",
        legendary: "#facc15",
        epic: "#a855f7",
        rare: "#3b82f6",
        common: "#94a3b8",
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
