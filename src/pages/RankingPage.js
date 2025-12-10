import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import RankingCard from "../components/RankingCard";
import { getAllNovels } from "../utils/novelsHelper";
import { initializeStats, getRankingData } from "../utils/statsManager";

export default function RankingPage() {
  const [activeTab, setActiveTab] = useState("views"); // views | favorites | new
  const [rankedNovels, setRankedNovels] = useState([]);

  useEffect(() => {
    // 取得所有小說 (包含上傳的)
    const allNovels = getAllNovels();

    // 初始化統計數據
    initializeStats(allNovels);

    // 載入排行榜數據
    loadRankingData(activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // ========== 載入排行榜數據 ==========
  const loadRankingData = (sortBy) => {
    const allNovels = getAllNovels();
    const data = getRankingData(allNovels, sortBy, 10); // 限制顯示 Top 10
    setRankedNovels(data);
  };

  // ========== 切換分頁 ==========
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // ========== 分頁按鈕樣式 ==========
  const getTabButtonClass = (tab) => {
    return `px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
      activeTab === tab
        ? "bg-primary text-white shadow-lg"
        : "bg-white text-gray-600 hover:bg-light border border-gray-300"
    }`;
  };

  // ========== 取得統計值 ==========
  const getStatValue = (novel) => {
    switch (activeTab) {
      case "views":
        return novel.stats.views;
      case "favorites":
        return novel.stats.favorites;
      case "new":
        return novel.createdAt;
      default:
        return 0;
    }
  };

  return (
    <div className="min-h-screen bg-light">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* ========== 標題 ========== */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-dark mb-2">小說排行榜</h1>
          <p className="text-gray-600">探索最受歡迎的小說,找到你的下一本好書</p>
        </div>

        {/* ========== 分頁切換按鈕 ========== */}
        <div className="flex gap-4 mb-8 flex-wrap">
          <button
            onClick={() => handleTabChange("views")}
            className={getTabButtonClass("views")}
          >
            人氣榜
          </button>
          <button
            onClick={() => handleTabChange("favorites")}
            className={getTabButtonClass("favorites")}
          >
            收藏榜
          </button>
          <button
            onClick={() => handleTabChange("new")}
            className={getTabButtonClass("new")}
          >
            新書榜
          </button>
        </div>

        {/* ========== 排行榜說明 ========== */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <p className="text-sm text-gray-600">
            {activeTab === "views" && (
              <>
                <strong>人氣榜</strong>: 根據閱讀次數排序,最受歡迎的作品
              </>
            )}
            {activeTab === "favorites" && (
              <>
                <strong>收藏榜</strong>: 根據收藏人數排序,最值得珍藏的作品
              </>
            )}
            {activeTab === "new" && (
              <>
                <strong>新書榜</strong>: 最新上架的作品,搶先閱讀
              </>
            )}
          </p>
        </div>

        {/* ========== 排行榜列表 ========== */}
        <div className="space-y-4">
          {rankedNovels.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">暫無排行榜數據</p>
            </div>
          ) : (
            <>
              {rankedNovels.map((novel, index) => (
                <RankingCard
                  key={novel.id}
                  novel={novel}
                  rank={index + 1}
                  showStat={activeTab}
                  statValue={getStatValue(novel)}
                />
              ))}

              {/* 查看更多按鈕 */}
              <div className="text-center pt-6">
                <Link
                  to={`/ranking/${activeTab}`}
                  className="inline-block px-8 py-3 bg-white text-primary border-2 border-primary rounded-lg hover:bg-primary hover:text-white transition-all duration-300 font-semibold"
                >
                  查看完整榜單 →
                </Link>
              </div>
            </>
          )}
        </div>

        {/* ========== 排行榜底部提示 ========== */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            排行榜數據每日更新,快來支持你喜歡的作品吧!
          </p>
        </div>
      </div>
    </div>
  );
}
