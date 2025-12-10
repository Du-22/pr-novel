import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import RankingCard from "../components/RankingCard";
import { getAllNovels } from "../utils/novelsHelper";
import { initializeStats, getRankingData } from "../utils/statsManager";

export default function ViewsRankingPage() {
  const [rankedNovels, setRankedNovels] = useState([]);

  useEffect(() => {
    // 取得所有小說 (包含上傳的)
    const allNovels = getAllNovels();

    // 初始化統計數據
    initializeStats(allNovels);

    // 載入人氣榜數據 (Top 30)
    const data = getRankingData(allNovels, "views", 30);
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
          <h1 className="text-4xl font-bold text-dark mb-2">人氣榜 Top 30</h1>
          <p className="text-gray-600">
            根據閱讀次數排序,最受歡迎的作品都在這裡
          </p>
        </div>

        {/* ========== 榜單說明 ========== */}
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg shadow-md p-6 mb-6 border-l-4 border-primary">
          <h3 className="font-bold text-dark mb-2">關於人氣榜</h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            人氣榜根據小說的閱讀次數進行排序,每次進入小說詳情頁都會增加閱讀數。想讓你喜歡的作品登上榜首?快來閱讀並分享給朋友吧!
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
                showStat="views"
                statValue={novel.stats.views}
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
