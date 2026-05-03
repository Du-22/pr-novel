// ============================================
// 檔案名稱: SearchPage.js
// 路徑: src/pages/SearchPage.js
// 用途: 搜尋結果頁(依標題、作者、標籤過濾,支援類別篩選)
// ============================================

import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
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
        default:
          return (
            novel.title.toLowerCase().includes(keyword) ||
            novel.author.toLowerCase().includes(keyword) ||
            novel.tags.some((tag) => tag.toLowerCase().includes(keyword))
          );
      }
    });

    setResults(filtered);
  }, [query, category]);

  useEffect(() => {
    setCategory(typeParam);
  }, [typeParam]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    navigate(`/search?q=${encodeURIComponent(inputValue.trim())}&type=${category}`);
  };

  const handleCategoryChange = (newCategory) => {
    setCategory(newCategory);
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}&type=${newCategory}`);
    }
  };

  const categoryLabel = CATEGORIES.find((c) => c.value === category)?.label;

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950">
      <Navbar showBackButton={true} />

      <main className="flex-1 container mx-auto px-4 py-8 md:py-12 max-w-6xl">
        {/* ========== 搜尋列 ========== */}
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500 pointer-events-none" />
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="輸入關鍵字..."
                autoFocus
                className="w-full pl-10 pr-4 py-3 rounded-lg border
                           bg-white text-neutral-900 placeholder-neutral-400 border-neutral-300
                           focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
                           dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder-neutral-500 dark:border-neutral-700"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 rounded-lg font-semibold transition-colors
                         bg-primary text-white hover:bg-primary-dark"
            >
              搜尋
            </button>
          </div>
        </form>

        {/* ========== 類別篩選 ========== */}
        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => handleCategoryChange(c.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                category === c.value
                  ? "bg-primary text-white shadow-sm"
                  : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 hover:text-neutral-900 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-neutral-100"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* ========== 結果統計 ========== */}
        {query.trim() && (
          <p className="mb-6 text-sm text-neutral-600 dark:text-neutral-400">
            {category !== "all" && (
              <span className="mr-1">[{categoryLabel}]</span>
            )}
            「
            <strong className="text-neutral-900 dark:text-neutral-100">
              {query}
            </strong>
            」共找到{" "}
            <strong className="text-neutral-900 dark:text-neutral-100">
              {results.length}
            </strong>{" "}
            本
          </p>
        )}

        {/* ========== 搜尋結果 ========== */}
        {!query.trim() ? (
          <div className="p-12 text-center rounded-xl border
                          bg-white border-neutral-200
                          dark:bg-neutral-900 dark:border-neutral-800">
            <Search className="w-12 h-12 mx-auto mb-3 text-neutral-300 dark:text-neutral-700" />
            <p className="text-neutral-500 dark:text-neutral-400">
              輸入關鍵字開始搜尋
            </p>
          </div>
        ) : results.length === 0 ? (
          <div className="p-12 text-center rounded-xl border
                          bg-white border-neutral-200
                          dark:bg-neutral-900 dark:border-neutral-800">
            <p className="text-lg mb-2 text-neutral-600 dark:text-neutral-400">
              找不到相關小說
            </p>
            <p className="text-sm text-neutral-500 dark:text-neutral-500">
              試試看切換搜尋類別或使用不同的關鍵字
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {results.map((novel) => (
              <NovelCard key={novel.id} novel={novel} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
