import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import NovelCard from "../components/NovelCard";
import NovelListItem from "../components/NovelListItem";
import ViewToggle from "../components/ViewToggle";
import { getAllNovels, getAllTags } from "../utils/novelsHelper";
import { getWeeklyRandomNovels, getRandomTagSections } from "../utils/random";

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
        {randomTagSections.length > 0 && (
          <div className="flex justify-end mb-4">
            <ViewToggle view={view} onChange={setView} />
          </div>
        )}
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

            {view === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {section.novels.map((novel) => (
                  <NovelCard key={novel.id} novel={novel} />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {section.novels.map((novel) => (
                  <NovelListItem key={novel.id} novel={novel} />
                ))}
              </div>
            )}
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
