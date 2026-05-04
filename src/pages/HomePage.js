// ============================================
// 檔案名稱: HomePage.js
// 路徑: src/pages/HomePage.js
// 用途: 首頁 — Hero + 本期強推 (Cover Flow 3D 書架) + 隨機標籤推薦 (grid/list)
// ============================================

import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import NovelCard from "../components/NovelCard";
import NovelListItem from "../components/NovelListItem";
import ViewToggle from "../components/ViewToggle";
import Footer from "../components/Footer";
import CoverFlowShelf from "../components/CoverFlowShelf";
import { getAllNovels, getAllTags } from "../utils/novelsHelper";
import { getWeeklyRandomNovels, getRandomTagSections } from "../utils/random";

// 區塊 heading 樣式統一抽出
const SectionHeader = ({ title, linkTo = "/tags", linkText = "查看更多" }) => (
  <div className="mb-6 flex items-baseline justify-between gap-4">
    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
      {title}
    </h2>
    <Link
      to={linkTo}
      className="flex-shrink-0 inline-flex items-center gap-1 text-sm font-medium
                 text-primary hover:text-primary-dark transition-colors
                 dark:text-primary-light dark:hover:text-primary"
    >
      {linkText}
      <ArrowRight className="w-4 h-4" />
    </Link>
  </div>
);

const HomePage = () => {
  const [view, setView] = useState("grid");

  // ========== 取得所有小說 (mockData + 上傳的) ==========
  const allNovels = useMemo(() => {
    return getAllNovels();
  }, []);

  // ========== 本期強推:每週隨機 5 本 ==========
  const featuredNovels = useMemo(() => {
    return getWeeklyRandomNovels(allNovels, 5);
  }, [allNovels]);

  // ========== 隨機標籤區:每次開網頁都不同 ==========
  const randomTagSections = useMemo(() => {
    return getRandomTagSections(getAllTags(), allNovels, 2, 3);
  }, [allNovels]);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <Navbar />

      <HeroSection />

      <main className="container mx-auto px-4 py-12 md:py-16">
        {/* ========== 本期強推 (Cover Flow 3D 書架) ========== */}
        <section className="mb-12 md:mb-16">
          <SectionHeader title="本期強推" />
          <CoverFlowShelf books={featuredNovels} />
        </section>

        {/* ========== View toggle (隨機標籤區的控制) ========== */}
        {randomTagSections.length > 0 && (
          <div className="mb-6 flex justify-end">
            <ViewToggle view={view} onChange={setView} />
          </div>
        )}

        {/* ========== 隨機標籤區 ========== */}
        {randomTagSections.map((section, index) => (
          <section
            key={index}
            className="mb-12 md:mb-16 last:mb-0"
          >
            <SectionHeader title={section.title} />

            {view === "grid" ? (
              // 卡片視圖:橫向滾動 + 固定寬度,跟舊版本期強推同樣的卡片尺寸 (170/220/280)
              <div className="overflow-x-auto pb-4 -mx-4 px-4">
                <div className="flex gap-4 sm:gap-6" style={{ minWidth: "min-content" }}>
                  {section.novels.map((novel) => (
                    <div
                      key={novel.id}
                      className="flex-shrink-0 w-[170px] sm:w-[220px] md:w-[280px]"
                    >
                      <NovelCard novel={novel} />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {section.novels.map((novel) => (
                  <NovelListItem key={novel.id} novel={novel} />
                ))}
              </div>
            )}
          </section>
        ))}
      </main>

      <Footer />
    </div>
  );
};

export default HomePage;
