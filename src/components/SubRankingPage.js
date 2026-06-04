// ============================================
// 檔案名稱: SubRankingPage.js
// 路徑: src/components/SubRankingPage.js
// 用途: 排行榜子頁(人氣榜 / 收藏榜 / 新書榜)— 三榜各一獨立路徑,
//       上方 segmented control 切換,進頁主動 refresh 拿最新數據
// ============================================

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import RankingCard from "./RankingCard";
import { getAllNovels, refreshNovels } from "../utils/novelsHelper";
import { initializeStats, getRankingData } from "../utils/statsManager";

const TYPES = {
  views: {
    title: "人氣榜 Top 30",
    shortName: "人氣榜",
    subtitle: "根據閱讀次數排序,最受歡迎的作品都在這裡",
    description:
      "人氣榜根據小說的閱讀次數進行排序,每次進入小說章節都會增加閱讀數。想讓你喜歡的作品登上榜首?快來閱讀並分享給朋友吧!",
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

const TABS_ORDER = ["views", "favorites", "new"];

export default function SubRankingPage({ type }) {
  const [rankedNovels, setRankedNovels] = useState([]);
  const [loading, setLoading] = useState(true);
  const config = TYPES[type];

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      // 主動 refresh 從 Firestore 拿最新 stats(避免顯示快取舊數字)
      await refreshNovels();
      if (cancelled) return;
      const allNovels = getAllNovels();
      initializeStats(allNovels);
      const data = getRankingData(allNovels, type, 30);
      setRankedNovels(data);
      setLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [type]);

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8 md:py-12 max-w-5xl">
        {/* ========== 標題區 ========== */}
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2
                         text-neutral-900 dark:text-neutral-100">
            {config.title}
          </h1>
          <p className="text-base text-neutral-600 dark:text-neutral-400">
            {config.subtitle}
          </p>
        </div>

        {/* ========== Tab 切換 — segmented control(用 Link 切 URL)========== */}
        <div className="inline-flex p-1 mb-6 rounded-lg gap-1
                        bg-neutral-100 dark:bg-neutral-800">
          {TABS_ORDER.map((key) => {
            const isActive = key === type;
            return (
              <Link
                key={key}
                to={`/ranking/${key}`}
                replace
                className={`px-4 sm:px-5 py-2 rounded-md text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-white text-primary shadow-sm dark:bg-neutral-700 dark:text-primary-light"
                    : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                }`}
              >
                {TYPES[key].shortName}
              </Link>
            );
          })}
        </div>

        {/* ========== 榜單說明 ========== */}
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
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16
                            text-neutral-500 dark:text-neutral-400">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-sm">載入最新榜單...</span>
            </div>
          ) : rankedNovels.length === 0 ? (
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
        {!loading && rankedNovels.length > 0 && (
          <p className="mt-10 text-center text-sm text-neutral-500 dark:text-neutral-400">
            已顯示全部 {rankedNovels.length} 本小說
          </p>
        )}
      </main>

      <Footer />
    </div>
  );
}
