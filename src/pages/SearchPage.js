// ============================================
// 檔案名稱: SearchPage.js
// 路徑: src/pages/SearchPage.js
// 用途: 搜尋結果頁（依標題、作者、標籤過濾，支援類別篩選）
// ============================================
import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import NovelCard from "../components/NovelCard";
import { getAllNovels } from "../utils/novelsHelper";

const CATEGORIES = [
  { value: "all", label: "全部" },
  { value: "title", label: "作品名" },
  { value: "author", label: "作者名" },
  { value: "tag", label: "標籤" },
];

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const query = searchParams.get("q") || "";
  const typeParam = searchParams.get("type") || "all";

  const [results, setResults] = useState([]);
  const [inputValue, setInputValue] = useState(query);
  const [category, setCategory] = useState(typeParam);

  // query 或 category 改變時重新過濾
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const keyword = query.trim().toLowerCase();
    const allNovels = getAllNovels();

    const filtered = allNovels.filter((novel) => {
      switch (category) {
        case "title":
          return novel.title.toLowerCase().includes(keyword);
        case "author":
          return novel.author.toLowerCase().includes(keyword);
        case "tag":
          return novel.tags.some((tag) => tag.toLowerCase().includes(keyword));
        default: // "all"
          return (
            novel.title.toLowerCase().includes(keyword) ||
            novel.author.toLowerCase().includes(keyword) ||
            novel.tags.some((tag) => tag.toLowerCase().includes(keyword))
          );
      }
    });

    setResults(filtered);
  }, [query, category]);

  // URL 的 type 參數變動時同步 category state
  useEffect(() => {
    setCategory(typeParam);
  }, [typeParam]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    navigate(
      `/search?q=${encodeURIComponent(inputValue.trim())}&type=${category}`
    );
  };

  const handleCategoryChange = (newCategory) => {
    setCategory(newCategory);
    if (query.trim()) {
      navigate(
        `/search?q=${encodeURIComponent(query)}&type=${newCategory}`
      );
    }
  };

  const categoryLabel = CATEGORIES.find((c) => c.value === category)?.label;

  return (
    <div className="min-h-screen bg-light">
      <Navbar showBackButton={true} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 搜尋列 */}
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="輸入關鍵字..."
              autoFocus
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-primary/50
                       text-dark bg-white"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90
                       transition-colors font-semibold"
            >
              搜尋
            </button>
          </div>
        </form>

        {/* 類別篩選 */}
        <div className="flex gap-2 mb-6">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => handleCategoryChange(c.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors
                ${
                  category === c.value
                    ? "bg-primary text-white"
                    : "bg-white text-gray-600 border border-gray-300 hover:border-primary"
                }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* 結果統計 */}
        {query.trim() && (
          <p className="text-gray-600 mb-6">
            {category !== "all" && (
              <span className="mr-1">
                [{categoryLabel}]
              </span>
            )}
            「<span className="font-semibold text-dark">{query}</span>」共找到{" "}
            <span className="font-semibold text-dark">{results.length}</span> 本
          </p>
        )}

        {/* 搜尋結果 */}
        {!query.trim() ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500">輸入關鍵字開始搜尋</p>
          </div>
        ) : results.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">找不到相關小說</p>
            <p className="text-gray-400 text-sm mt-2">
              試試看切換搜尋類別或使用不同的關鍵字
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((novel) => (
              <NovelCard key={novel.id} novel={novel} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
