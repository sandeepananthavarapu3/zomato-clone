/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        zomato: "#E23744",
        surface: "#F8F8F8",
        textPrimary: "#1C1C1C",
        textSecondary: "#696969",
        textMuted: "#9C9C9C",
        border: "#E8E8E8",
        success: "#3AB757",
        warning: "#F5A623",
      }
    },
  },
  plugins: [],
}
