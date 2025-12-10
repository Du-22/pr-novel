import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import NovelCard from "../components/NovelCard";
import { allTags } from "../data/mockData";
import { getAllNovels } from "../utils/novelsHelper";
import { getWeeklyRandomNovels, getRandomTagSections } from "../utils/random";

const HomePage = () => {
  // ========== 取得所有小說 (mockData + 上傳的) ==========
  const allNovels = useMemo(() => {
    return getAllNovels();
  }, []);

  // ========== 本期強推:每週隨機 6 本 ==========
  const featuredNovels = useMemo(() => {
    return getWeeklyRandomNovels(allNovels, 6);
  }, [allNovels]);

  // ========== 隨機標籤區:每次開網頁都不同 ==========
  const randomTagSections = useMemo(() => {
    return getRandomTagSections(allTags, allNovels, 2, 3);
  }, [allNovels]);

  return (
    <div className="min-h-screen bg-light">
      {/* 導覽列 */}
      <Navbar />

      {/* Hero 區塊 */}
      <HeroSection />

      {/* 主要內容區 */}
      <div className="container mx-auto px-4 py-12">
        {/* ========== 本期強推(橫向滾動) ========== */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-dark">本期強推</h2>
            <Link
              to="/tags"
              className="text-primary hover:text-secondary transition-colors text-sm font-medium"
            >
              更多 &gt;
            </Link>
          </div>

          {/* 橫向滾動容器 */}
          <div className="overflow-x-auto pb-4 -mx-4 px-4">
            <div className="flex gap-6" style={{ minWidth: "min-content" }}>
              {featuredNovels.map((novel) => (
                <div
                  key={novel.id}
                  className="flex-shrink-0"
                  style={{ width: "280px" }}
                >
                  <NovelCard novel={novel} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========== 隨機標籤區 ========== */}
        {randomTagSections.map((section, index) => (
          <section key={index} className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-dark">{section.title}</h2>
              <Link
                to="/tags"
                className="text-primary hover:text-secondary transition-colors text-sm font-medium"
              >
                更多 &gt;
              </Link>
            </div>

            {/* 小說卡片網格 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {section.novels.map((novel) => (
                <NovelCard key={novel.id} novel={novel} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* 頁尾 */}
      <footer className="bg-dark text-white py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">PR小說網 © 2024 | 關於我們 | 聯絡我們</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
