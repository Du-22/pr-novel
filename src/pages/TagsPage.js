// ============================================
// 檔案名稱: TagsPage.js
// 路徑: src/pages/TagsPage.js
// 用途: 標籤篩選頁 — 多選標籤 (AND 邏輯) + 排序 + grid/list 切換
// ============================================

import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { X, ChevronUp, ChevronDown } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import NovelCard from "../components/NovelCard";
import NovelListItem from "../components/NovelListItem";
import ViewToggle from "../components/ViewToggle";
import { getAllNovels, getAllTags } from "../utils/novelsHelper";
import { getRankingData } from "../utils/statsManager";

export default function TagsPage() {
  const [searchParams] = useSearchParams();
  // 從 ?tag=xxx 或 ?tag=xxx&tag=yyy 初始勾選（支援多 tag）
  const [selectedTags, setSelectedTags] = useState(() => {
    const tags = searchParams.getAll("tag");
    return tags.length > 0 ? tags : [];
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [sortBy, setSortBy] = useState(
    () => sessionStorage.getItem("tagsSortBy") || "new"
  );
  const [filteredNovels, setFilteredNovels] = useState([]);
  const [view, setView] = useState("grid");

  const allTags = useMemo(() => getAllTags(), []);

  useEffect(() => {
    let novels = getAllNovels();
    if (selectedTags.length > 0) {
      novels = novels.filter((novel) =>
        selectedTags.every((tag) => novel.tags.includes(tag))
      );
    }
    setFilteredNovels(getRankingData(novels, sortBy));
  }, [selectedTags, sortBy]);

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const removeTag = (tag) => {
    setSelectedTags((prev) => prev.filter((t) => t !== tag));
  };

  const clearAllTags = () => setSelectedTags([]);

  const displayedTags = isExpanded ? allTags : allTags.slice(0, 10);

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950">
      <Navbar showBackButton={true} />

      <main className="flex-1 container mx-auto px-4 py-8 md:py-12 max-w-7xl">
        {/* ========== 頁面標題 ========== */}
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-8 text-center
                       text-neutral-900 dark:text-neutral-100">
          標籤篩選
        </h1>

        {/* ========== 已選標籤區 ========== */}
        {selectedTags.length > 0 && (
          <div className="mb-6 p-5 rounded-xl border
                          bg-white border-neutral-200
                          dark:bg-neutral-900 dark:border-neutral-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                已選標籤 ({selectedTags.length})
              </h2>
              <button
                onClick={clearAllTags}
                className="text-sm font-medium transition-colors
                           text-primary hover:text-primary-dark
                           dark:text-primary-light dark:hover:text-primary"
              >
                清空全部
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedTags.map((tag) => (
                <div
                  key={tag}
                  className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-full
                             bg-primary text-white text-sm shadow-sm"
                >
                  <span>{tag}</span>
                  <button
                    onClick={() => removeTag(tag)}
                    className="p-0.5 rounded-full hover:bg-white/20 transition-colors"
                    aria-label={`移除 ${tag}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========== 所有標籤區 ========== */}
        <div className="mb-6 p-5 rounded-xl border
                        bg-white border-neutral-200
                        dark:bg-neutral-900 dark:border-neutral-800">
          <h2 className="text-base font-semibold mb-4 text-neutral-900 dark:text-neutral-100">
            所有標籤
          </h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {displayedTags.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                  selectedTags.includes(tag)
                    ? "bg-primary text-white shadow-sm"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 hover:text-neutral-900 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-neutral-100"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {allTags.length > 10 && (
            <div className="text-center">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors
                           text-primary hover:text-primary-dark
                           dark:text-primary-light dark:hover:text-primary"
              >
                {isExpanded ? "收起" : "展開查看全部標籤"}
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* ========== 排序 & 結果統計 ========== */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            找到{" "}
            <strong className="text-neutral-900 dark:text-neutral-100">
              {filteredNovels.length}
            </strong>{" "}
            本小說
          </p>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                排序:
              </span>
              <select
                value={sortBy}
                onChange={(e) => {
                  sessionStorage.setItem("tagsSortBy", e.target.value);
                  setSortBy(e.target.value);
                }}
                className="px-3 py-1.5 text-sm rounded-lg border cursor-pointer
                           bg-white text-neutral-900 border-neutral-300
                           focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
                           dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700"
              >
                <option value="new">最新上架</option>
                <option value="favorites">最多收藏</option>
                <option value="views">最多閱讀</option>
              </select>
            </div>
            <ViewToggle view={view} onChange={setView} />
          </div>
        </div>

        {/* ========== 篩選結果 ========== */}
        {filteredNovels.length === 0 ? (
          <div className="p-12 text-center rounded-xl border
                          bg-white border-neutral-200
                          dark:bg-neutral-900 dark:border-neutral-800">
            <p className="text-lg mb-2 text-neutral-600 dark:text-neutral-400">
              找不到符合條件的小說
            </p>
            <p className="text-sm text-neutral-500 dark:text-neutral-500">
              試試看調整篩選條件或清空標籤
            </p>
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredNovels.map((novel) => (
              <NovelCard key={novel.id} novel={novel} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNovels.map((novel) => (
              <NovelListItem key={novel.id} novel={novel} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
