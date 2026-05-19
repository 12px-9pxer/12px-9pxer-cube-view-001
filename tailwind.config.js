/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        pretendard: ["Pretendard", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "glass-soft": "0 24px 90px rgba(0, 0, 0, 0.32)",
      },
    },
  },
  plugins: [],
};
