// ============================================
// 檔案名稱: RankingPage.js
// 路徑: src/pages/RankingPage.js
// 用途: 排行榜總覽頁 — 三個分頁 (人氣榜 / 收藏榜 / 新書榜) 各顯示 Top 10
// ============================================

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import RankingCard from "../components/RankingCard";
import { getAllNovels } from "../utils/novelsHelper";
import { initializeStats, getRankingData } from "../utils/statsManager";

const TABS = [
  { key: "views", label: "人氣榜", desc: "根據閱讀次數排序,最受歡迎的作品" },
  { key: "favorites", label: "收藏榜", desc: "根據收藏人數排序,最值得珍藏的作品" },
  { key: "new", label: "新書榜", desc: "最新上架的作品,搶先閱讀" },
];

export default function RankingPage() {
  const [activeTab, setActiveTab] = useState("views");
  const [rankedNovels, setRankedNovels] = useState([]);

  useEffect(() => {
    const allNovels = getAllNovels();
    initializeStats(allNovels);
    const data = getRankingData(allNovels, activeTab, 10);
    setRankedNovels(data);
  }, [activeTab]);

  const activeTabInfo = TABS.find((t) => t.key === activeTab);

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8 md:py-12 max-w-5xl">
        {/* ========== 標題 ========== */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2
                         text-neutral-900 dark:text-neutral-100">
            小說排行榜
          </h1>
          <p className="text-base text-neutral-600 dark:text-neutral-400">
            探索最受歡迎的小說,找到你的下一本好書
          </p>
        </div>

        {/* ========== Tab 切換 (segmented control 風格) ========== */}
        <div className="inline-flex p-1 mb-6 rounded-lg gap-1
                        bg-neutral-100 dark:bg-neutral-800">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 sm:px-5 py-2 rounded-md text-sm font-semibold transition-all ${
                activeTab === tab.key
                  ? "bg-white text-primary shadow-sm dark:bg-neutral-700 dark:text-primary-light"
                  : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ========== 當前榜單說明 ========== */}
        <div className="mb-6 p-4 rounded-xl border
                        bg-white border-neutral-200
                        dark:bg-neutral-900 dark:border-neutral-800">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            <strong className="text-neutral-900 dark:text-neutral-100">
              {activeTabInfo.label}
            </strong>
            <span className="mx-1">·</span>
            {activeTabInfo.desc}
          </p>
        </div>

        {/* ========== 排行列表 ========== */}
        <div className="space-y-3">
          {rankedNovels.length === 0 ? (
            <div className="text-center py-16 text-neutral-500 dark:text-neutral-400">
              暫無排行榜數據
            </div>
          ) : (
            <>
              {rankedNovels.map((novel, index) => (
                <RankingCard
                  key={novel.id}
                  novel={novel}
                  rank={index + 1}
                />
              ))}

              {/* 查看完整榜單 */}
              <div className="text-center pt-6">
                <Link
                  to={`/ranking/${activeTab}`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold
                             border-2 border-primary text-primary
                             hover:bg-primary hover:text-white transition-all
                             dark:border-primary-light dark:text-primary-light
                             dark:hover:bg-primary-light dark:hover:text-neutral-900"
                >
                  查看完整榜單
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </>
          )}
        </div>

        {/* ========== 底部提示 ========== */}
        <p className="mt-8 text-center text-xs text-neutral-500 dark:text-neutral-400">
          排行榜數據每日更新,快來支持你喜歡的作品吧
        </p>
      </main>

      <Footer />
    </div>
  );
}
