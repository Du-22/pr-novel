// ============================================
// 檔案名稱: Logo.js
// 路徑: src/components/Logo.js
// 用途: PR 小說網字標 logo (PR Monogram)
//       自訂字符:P 的字幹 + 字碗 + R 的腳延伸出來,單一筆畫構成「PR」連體
// ============================================

import React from "react";

/**
 * PR 小說網 logo (字標)
 *
 * @param {string} className - Tailwind 樣式,可控制尺寸與顏色
 *                             預設 w-9 h-9 text-primary
 *                             範例:"w-6 h-6 text-white"(navbar 用)、"w-12 h-12 text-primary-dark"(loading 畫面用)
 * @param {object} props - 其他傳遞給 svg 的屬性
 */
const Logo = ({ className = "w-9 h-9 text-primary", ...props }) => (
  <svg
    viewBox="0 0 60 64"
    fill="none"
    stroke="currentColor"
    strokeWidth="9"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    role="img"
    aria-label="PR 小說網"
    {...props}
  >
    <line x1="10" y1="8" x2="10" y2="58" />
    <path d="M10 8 H30 a14 14 0 0 1 0 28 H10" />
    <line x1="22" y1="36" x2="50" y2="58" />
  </svg>
);

export default Logo;
