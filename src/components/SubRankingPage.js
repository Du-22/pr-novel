// ============================================
// 檔案名稱: SubRankingPage.js
// 路徑: src/components/SubRankingPage.js
// 用途: 排行榜子頁(新書榜 / 收藏榜 / 人氣榜)的共用版型,
//       由 type prop 決定顯示內容,各排行頁變成薄 wrapper
// ============================================

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import RankingCard from "./RankingCard";
import { getAllNovels } from "../utils/novelsHelper";
import { initializeStats, getRankingData } from "../utils/statsManager";

const TYPES = {
  views: {
    title: "人氣榜 Top 30",
    shortName: "人氣榜",
    subtitle: "根據閱讀次數排序,最受歡迎的作品都在這裡",
    description:
      "人氣榜根據小說的閱讀次數進行排序,每次進入小說詳情頁都會增加閱讀數。想讓你喜歡的作品登上榜首?快來閱讀並分享給朋友吧!",
  },
  favorites: {
    title: "收藏榜 Top 30",
    shortName: "收藏榜",
    subtitle: "根據收藏人數排序,最值得珍藏的作品都在這裡",
    description:
      "收藏榜根據小說的收藏人數進行排序,這些作品都是讀者精挑細選、值得反覆品味的佳作。點擊小說詳情頁的「加入收藏」按鈕,就能支持你喜愛的作品!",
  },
  new: {
    title: "新書榜 Top 30",
    shortName: "新書榜",
    subtitle: "最新上架的作品,搶先閱讀最新故事",
    description:
      "新書榜根據小說的發布日期排序,展示最新上架的作品。想要第一時間發現好故事?快來新書榜挖寶吧!這裡有最新鮮、最具創意的內容等你探索。",
  },
};

export default function SubRankingPage({ type }) {
  const [rankedNovels, setRankedNovels] = useState([]);
  const config = TYPES[type];

  useEffect(() => {
    const allNovels = getAllNovels();
    initializeStats(allNovels);
    const data = getRankingData(allNovels, type, 30);
    setRankedNovels(data);
  }, [type]);

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950">
      <Navbar showBackButton={true} />

      <main className="flex-1 container mx-auto px-4 py-8 md:py-12 max-w-5xl">
        {/* ========== 返回連結 ========== */}
        <Link
          to="/ranking"
          className="inline-flex items-center gap-1 mb-4 text-sm font-medium transition-colors
                     text-primary hover:text-primary-dark
                     dark:text-primary-light dark:hover:text-primary"
        >
          <ArrowLeft className="w-4 h-4" />
          返回排行榜
        </Link>

        {/* ========== 標題區 ========== */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2
                         text-neutral-900 dark:text-neutral-100">
            {config.title}
          </h1>
          <p className="text-base text-neutral-600 dark:text-neutral-400">
            {config.subtitle}
          </p>
        </div>

        {/* ========== 榜單說明 (改 subtle card,移除原本的左色條+漸層 AI 味) ========== */}
        <div className="mb-6 p-5 rounded-xl border
                        bg-white border-neutral-200
                        dark:bg-neutral-900 dark:border-neutral-800">
          <h3 className="text-base font-semibold mb-2 text-neutral-900 dark:text-neutral-100">
            關於{config.shortName}
          </h3>
          <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
            {config.description}
          </p>
        </div>

        {/* ========== 排行列表 ========== */}
        <div className="space-y-3">
          {rankedNovels.length === 0 ? (
            <div className="text-center py-16 text-neutral-500 dark:text-neutral-400">
              暫無排行榜數據
            </div>
          ) : (
            rankedNovels.map((novel, index) => (
              <RankingCard key={novel.id} novel={novel} rank={index + 1} />
            ))
          )}
        </div>

        {/* ========== 底部提示 ========== */}
        <div className="mt-10 text-center">
          <p className="text-sm mb-4 text-neutral-500 dark:text-neutral-400">
            已顯示全部 {rankedNovels.length} 本小說
          </p>
          <Link
            to="/ranking"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all
                       bg-primary text-white shadow-sm
                       hover:bg-primary-dark hover:-translate-y-0.5 hover:shadow-md"
          >
            返回排行榜首頁
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
