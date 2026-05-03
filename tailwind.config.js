/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // === Brand 色系(從單一值擴充為完整階梯) ===
        // 既有的 `bg-primary` `text-primary` 仍然有效(對應 DEFAULT)
        primary: {
          DEFAULT: "#6C5CE7",
          dark: "#5849D6",
          light: "#8E80EE",
          50: "#F4F2FE",
          100: "#E5E1FC",
          200: "#CBC5F8",
          300: "#A99DF1",
          400: "#8E80EE",
          500: "#6C5CE7",
          600: "#5849D6",
          700: "#4338CA",
          800: "#3730A3",
          900: "#2D2570",
        },

        // === 暖色 accent(新增,用於收藏按鈕等強調點) ===
        // 新元件用 `bg-warm` `text-warm`,取代誤用 `bg-pink` 的紫色
        warm: {
          DEFAULT: "#FFB800",
          light: "#FFE082",
          50: "#FFF8E1",
        },

        // === Neutral scale(新增,取代散落的 Tailwind 預設 gray-*) ===
        // 新元件用 `bg-neutral-100` `text-neutral-700`,確保可隨 dark mode 切換
        neutral: {
          0: "#FFFFFF",
          50: "#FAFAFA",
          100: "#F4F4F5",
          200: "#E4E4E7",
          300: "#D4D4D8",
          400: "#A1A1AA",
          500: "#71717A",
          600: "#52525B",
          700: "#3F3F46",
          800: "#27272A",
          900: "#18181B",
        },

        // === 狀態語意色(新增,取代 bg-red-100 / bg-blue-100 等 rogue 用法) ===
        success: { DEFAULT: "#10B981", light: "#D1FAE5" },
        warning: { DEFAULT: "#F59E0B", light: "#FEF3C7" },
        danger: { DEFAULT: "#EF4444", light: "#FEE2E2" },
        info: { DEFAULT: "#3B82F6", light: "#DBEAFE" },

        // === 閱讀頁背景(新增,light/dark 雙色) ===
        reading: {
          light: "#FEFDFB",
          dark: "#1A1A1D",
        },

        // === 既有 token 保留 — 給尚未重構的元件繼續使用 ===
        // 待重構完成後可移除
        secondary: "#A29BFE",
        accent: "#6C5CE7", // 待重構:應改用 warm
        pink: "#6C5CE7", // 待重構:語意誤導,實為紫色
        dark: "#2D3436", // 待重構:應改用 neutral.800
        light: "#F8F9FA", // 待重構:應改用 neutral.50
      },

      // === 字型系統(等 index.css 載入 Google Fonts 後生效) ===
      fontFamily: {
        heading: ['"Noto Sans TC"', '"Plus Jakarta Sans"', "sans-serif"],
        body: ['"Noto Serif TC"', "serif"],
      },
    },
  },
  plugins: [],
};
