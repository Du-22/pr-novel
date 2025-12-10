import React, { useState, useEffect, useMemo } from "react";
import Navbar from "../components/Navbar";
import NovelCard from "../components/NovelCard";
import { getAllNovels, getAllTags } from "../utils/novelsHelper";
import { getRankingData } from "../utils/statsManager";

export default function TagsPage() {
  const [selectedTags, setSelectedTags] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [sortBy, setSortBy] = useState("new"); // 'new' | 'views' | 'favorites'
  const [filteredNovels, setFilteredNovels] = useState([]);

  // 動態計算所有標籤 (包含上傳的小說)
  const allTags = useMemo(() => {
    return getAllTags();
  }, []); // 空依賴,只在初次載入時計算

  // 當選擇的標籤或排序改變時,更新篩選結果
  useEffect(() => {
    updateFilteredNovels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTags, sortBy]);

  // ========== 更新篩選結果 ==========
  const updateFilteredNovels = () => {
    // 取得所有小說 (mockData + 上傳的)
    let novels = getAllNovels();

    // 1. 標籤篩選 (AND 邏輯)
    if (selectedTags.length > 0) {
      novels = novels.filter((novel) =>
        selectedTags.every((tag) => novel.tags.includes(tag))
      );
    }

    // 2. 排序
    const sortedNovels = getRankingData(novels, sortBy);

    setFilteredNovels(sortedNovels);
  };

  // ========== 切換標籤選擇 ==========
  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // ========== 移除單個標籤 ==========
  const removeTag = (tag) => {
    setSelectedTags(selectedTags.filter((t) => t !== tag));
  };

  // ========== 清空所有標籤 ==========
  const clearAllTags = () => {
    setSelectedTags([]);
  };

  // ========== 計算顯示的標籤 ==========
  const displayedTags = isExpanded ? allTags : allTags.slice(0, 10);

  return (
    <div className="min-h-screen bg-light">
      <Navbar showBackButton={true} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* ========== 頁面標題 ========== */}
        <h1 className="text-3xl font-bold text-dark mb-8 text-center">
          標籤篩選
        </h1>

        {/* ========== 已選標籤區 ========== */}
        <div
          className={`bg-white rounded-lg shadow-md mb-6 overflow-hidden transition-all duration-300
    ${selectedTags.length > 0 ? "p-6 opacity-100" : "p-0 h-0 opacity-0"}`}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-dark">
              已選標籤 ({selectedTags.length})
            </h2>
            <button
              onClick={clearAllTags}
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              清空全部
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            {selectedTags.map((tag) => (
              <div
                key={tag}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full 
                 bg-primary text-white shadow-md"
              >
                <span>{tag}</span>
                <button
                  onClick={() => removeTag(tag)}
                  className="hover:text-pink transition-colors text-lg leading-none"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ========== 所有標籤區 ========== */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-dark mb-4">所有標籤</h2>
          <div className="flex flex-wrap gap-3 mb-4">
            {displayedTags.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-4 py-2 rounded-full transition-all duration-200
                  ${
                    selectedTags.includes(tag)
                      ? "bg-primary text-white shadow-md hover:shadow-lg"
                      : "bg-white text-gray-600 border border-gray-300 hover:border-primary hover:shadow-md"
                  }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* 展開/收起按鈕 */}
          {allTags.length > 10 && (
            <div className="text-center">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-primary hover:text-primary/80 transition-colors
                         font-medium inline-flex items-center gap-2"
              >
                {isExpanded ? (
                  <>
                    收起 <span className="text-sm">▲</span>
                  </>
                ) : (
                  <>
                    展開查看全部標籤 <span className="text-sm">▼</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* ========== 排序 & 結果統計 ========== */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">
            找到{" "}
            <span className="font-semibold text-dark">
              {filteredNovels.length}
            </span>{" "}
            本小說
          </p>

          <div className="flex items-center gap-2">
            <span className="text-gray-600">排序:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg 
                       focus:outline-none focus:ring-2 focus:ring-primary/50
                       bg-white text-dark cursor-pointer"
            >
              <option value="new">最新上架</option>
              <option value="favorites">最多收藏</option>
              <option value="views">最多閱讀</option>
            </select>
          </div>
        </div>

        {/* ========== 篩選結果 ========== */}
        {filteredNovels.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">找不到符合條件的小說 😢</p>
            <p className="text-gray-400 text-sm mt-2">
              試試看調整篩選條件或清空標籤
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNovels.map((novel) => (
              <NovelCard key={novel.id} novel={novel} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
