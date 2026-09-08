/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        teal: {
          accent: "#2dd4bf",
        },
      },
    },
  },
  plugins: [],
};
