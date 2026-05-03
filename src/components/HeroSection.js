// ============================================
// 檔案名稱: HeroSection.js
// 路徑: src/components/HeroSection.js
// 用途: 首頁 Hero 區塊 — 紫色品牌主視覺,雙 CTA(探索 + 創作),
//       搭配 radial highlight + 斜線紋理,自動配合 dark mode 降一階
// ============================================

import React from "react";
import { Link } from "react-router-dom";
import { Compass, PenLine } from "lucide-react";

const HERO_BG_LIGHT = `
  radial-gradient(circle at 18% 22%, rgba(255,255,255,0.18) 0%, transparent 55%),
  radial-gradient(circle at 82% 78%, rgba(0,0,0,0.22) 0%, transparent 55%),
  linear-gradient(135deg, #6C5CE7 0%, #5849D6 100%)
`;

const HERO_BG_DARK = `
  radial-gradient(circle at 18% 22%, rgba(255,255,255,0.12) 0%, transparent 55%),
  radial-gradient(circle at 82% 78%, rgba(0,0,0,0.30) 0%, transparent 55%),
  linear-gradient(135deg, #5849D6 0%, #4338CA 100%)
`;

const STRIPES =
  "repeating-linear-gradient(135deg, transparent 0, transparent 32px, rgba(255,255,255,0.04) 32px, rgba(255,255,255,0.04) 33px)";

const HeroSection = () => {
  return (
    <section className="container mx-auto px-4 mt-6 md:mt-8">
      <div
        className="hero-section relative overflow-hidden rounded-2xl shadow-xl text-white"
        style={{
          "--hero-bg-light": HERO_BG_LIGHT,
          "--hero-bg-dark": HERO_BG_DARK,
        }}
      >
        {/* 斜線紋理 overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: STRIPES }}
        />

        {/* 內容區 */}
        <div className="relative px-6 py-12 sm:px-10 sm:py-16 md:px-14 md:py-20">
          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight tracking-tight mb-4 text-balance">
              閱讀,是另一個版本的人生
            </h1>

            <p className="text-base sm:text-lg md:text-xl leading-relaxed opacity-90 mb-8 max-w-xl">
              在字裡行間,遇見從未走進的世界。一個讓創作者與讀者真正相遇的小說平台。
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/tags"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg
                           bg-white text-primary-dark font-semibold text-sm sm:text-base
                           shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                <Compass className="w-5 h-5" />
                開始探索
              </Link>
              <Link
                to="/upload"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg
                           bg-transparent text-white font-semibold text-sm sm:text-base
                           border border-white/40 hover:bg-white/10 hover:border-white transition-all"
              >
                <PenLine className="w-5 h-5" />
                成為創作者
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
