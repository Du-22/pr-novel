// ============================================
// 檔案名稱: DefaultCover.js
// 路徑: src/components/DefaultCover.js
// 用途: 預設封面 — 上傳者沒有上傳封面時使用,
//       由書名 hash 決定漸層配色,搭配直書書名與斜線紋理,
//       自動配合 dark mode 切換為對應的深色變體
// ============================================

import React from "react";

// 8 種深色基調漸層,每組含 light/dark 兩版,white text 對比度高
// dark mode 時透過 src/index.css 的 .default-cover 規則自動切換
const PALETTE = [
  // 深紫(brand)
  {
    light: "linear-gradient(160deg, #6C5CE7 0%, #5849D6 100%)",
    dark: "linear-gradient(160deg, #4338CA 0%, #312E81 100%)",
  },
  // 深灰
  {
    light: "linear-gradient(160deg, #2D3436 0%, #4A5568 100%)",
    dark: "linear-gradient(160deg, #18181B 0%, #27272A 100%)",
  },
  // 酒紅
  {
    light: "linear-gradient(160deg, #C44569 0%, #8B2D4D 100%)",
    dark: "linear-gradient(160deg, #831843 0%, #500724 100%)",
  },
  // 深藍
  {
    light: "linear-gradient(160deg, #3B5998 0%, #1F3A5F 100%)",
    dark: "linear-gradient(160deg, #1E3A5F 0%, #0F1F33 100%)",
  },
  // 墨綠
  {
    light: "linear-gradient(160deg, #1B4332 0%, #2D6A4F 100%)",
    dark: "linear-gradient(160deg, #0F2D1E 0%, #1A3D2A 100%)",
  },
  // 深金
  {
    light: "linear-gradient(160deg, #B8860B 0%, #8B6914 100%)",
    dark: "linear-gradient(160deg, #78491E 0%, #4A2D14 100%)",
  },
  // 深棕
  {
    light: "linear-gradient(160deg, #6B4423 0%, #4A2F18 100%)",
    dark: "linear-gradient(160deg, #3F2614 0%, #25160A 100%)",
  },
  // 靛紫
  {
    light: "linear-gradient(160deg, #4B0082 0%, #2D004F 100%)",
    dark: "linear-gradient(160deg, #2D004F 0%, #15002B 100%)",
  },
];

// 簡單字串 hash → 確保同一書名永遠對應同一漸層(deterministic)
const hashStr = (str) => {
  let h = 0;
  for (let i = 0; i < (str || "").length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
};

const STRIPES =
  "repeating-linear-gradient(135deg, transparent 0, transparent 20px, rgba(255,255,255,0.04) 20px, rgba(255,255,255,0.04) 21px)";

/**
 * 預設封面元件
 *
 * @param {string} title - 書名(用於 hash 決定漸層 + 直書顯示)
 * @param {string} author - 作者(底部小字顯示)
 * @param {string} className - 外層 Tailwind 樣式(尺寸由 parent 控制)
 *                             範例:"w-full h-full"(填滿 NovelCard 的 aspect ratio 容器)
 *                             或 "w-24 h-32"(NovelListItem 縮圖)
 */
const DefaultCover = ({ title = "", author = "", className = "" }) => {
  const idx = hashStr(title) % PALETTE.length;
  const { light, dark } = PALETTE[idx];

  return (
    <div
      className={`default-cover relative overflow-hidden flex flex-col justify-between p-4 text-white ${className}`}
      style={{
        "--cover-bg-light": light,
        "--cover-bg-dark": dark,
      }}
    >
      {/* 斜線紋理 overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: STRIPES }}
      />

      {/* 直書書名 */}
      <div
        className="relative z-10 text-base sm:text-lg font-bold leading-tight"
        style={{ writingMode: "vertical-rl", letterSpacing: "0.02em" }}
      >
        {title || "未命名"}
      </div>

      {/* 作者 */}
      {author && (
        <div
          className="relative z-10 self-end text-[10px] sm:text-xs opacity-85"
          style={{ letterSpacing: "0.1em" }}
        >
          {author} 著
        </div>
      )}
    </div>
  );
};

export default DefaultCover;
