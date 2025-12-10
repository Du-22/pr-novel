import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import RankingCard from "../components/RankingCard";
import { getAllNovels } from "../utils/novelsHelper";
import { initializeStats, getRankingData } from "../utils/statsManager";

export default function FavoritesRankingPage() {
  const [rankedNovels, setRankedNovels] = useState([]);

  useEffect(() => {
    // 取得所有小說 (包含上傳的)
    const allNovels = getAllNovels();

    // 初始化統計數據
    initializeStats(allNovels);

    // 載入收藏榜數據 (Top 30)
    const data = getRankingData(allNovels, "favorites", 30);
    setRankedNovels(data);
  }, []);

  return (
    <div className="min-h-screen bg-light">
      <Navbar showBackButton={true} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* ========== 標題區 ========== */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Link
              to="/ranking"
              className="text-primary hover:text-primary/80 transition-colors"
            >
              ← 返回排行榜
            </Link>
          </div>
          <h1 className="text-4xl font-bold text-dark mb-2">收藏榜 Top 30</h1>
          <p className="text-gray-600">
            根據收藏人數排序,最值得珍藏的作品都在這裡
          </p>
        </div>

        {/* ========== 榜單說明 ========== */}
        <div className="bg-gradient-to-r from-pink/10 to-primary/10 rounded-lg shadow-md p-6 mb-6 border-l-4 border-pink">
          <h3 className="font-bold text-dark mb-2">關於收藏榜</h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            收藏榜根據小說的收藏人數進行排序,這些作品都是讀者精挑細選、值得反覆品味的佳作。點擊小說詳情頁的「加入收藏」按鈕,就能支持你喜愛的作品!
          </p>
        </div>

        {/* ========== 排行榜列表 ========== */}
        <div className="space-y-4">
          {rankedNovels.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">暫無排行榜數據</p>
            </div>
          ) : (
            rankedNovels.map((novel, index) => (
              <RankingCard
                key={novel.id}
                novel={novel}
                rank={index + 1}
                showStat="favorites"
                statValue={novel.stats.favorites}
              />
            ))
          )}
        </div>

        {/* ========== 底部提示 ========== */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500 mb-4">
            已顯示全部 {rankedNovels.length} 本小說
          </p>
          <Link
            to="/ranking"
            className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold"
          >
            返回排行榜首頁
          </Link>
        </div>
      </div>
    </div>
  );
}
