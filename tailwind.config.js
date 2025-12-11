/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#6C5CE7", // 優雅紫
        secondary: "#A29BFE", // 淡紫
        accent: "#6C5CE7", // 改成主色紫
        pink: "#6C5CE7", // 收藏按鈕用紫色（和 primary 相同）
        dark: "#2D3436",
        light: "#F8F9FA",
      },
    },
  },
  plugins: [],
};
