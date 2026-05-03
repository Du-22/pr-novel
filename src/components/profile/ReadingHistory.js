// ============================================
// 檔案名稱: ReadingHistory.js
// 路徑: src/components/profile/ReadingHistory.js
// 用途: 個人中心「閱讀記錄」Tab — 顯示閱讀過的小說 + 進度條 + 繼續閱讀
// ============================================

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { History } from "lucide-react";
import DefaultCover from "../DefaultCover";
import { getAllReadHistory } from "../../utils/readHistoryManager";
import { getAllNovels } from "../../utils/novelsHelper";
import { parseNovelChapters } from "../../utils/parser";
import { ProfileListSkeleton } from "../Skeleton";

const DEFAULT_COVER_PATH = "/images/covers/default-cover.png";

export default function ReadingHistory() {
  const navigate = useNavigate();
  const [readingList, setReadingList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReadingHistory();
  }, []);

  const loadReadingHistory = async () => {
    setLoading(true);

    const history = await getAllReadHistory();
    const allNovels = getAllNovels();

    const historyArray = Object.keys(history)
      .map((novelId) => {
        const novel = allNovels.find((n) => n.id === novelId);
        if (!novel) return null;
        const record = history[novelId];
        return {
          novel,
          readChapters: record.readChapters || [],
          lastChapter: record.lastChapter || null,
          lastRead: record.lastRead,
        };
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.lastRead) - new Date(a.lastRead));

    const listWithChapters = await Promise.all(
      historyArray.map(async (item) => {
        try {
          if (item.novel.txtFile) {
            const response = await fetch(item.novel.txtFile);
            const txtContent = await response.text();
            const chapters = parseNovelChapters(txtContent);
            return { ...item, totalChapters: chapters.length };
          } else if (item.novel.chapters) {
            return { ...item, totalChapters: item.novel.chapters.length };
          }
          return { ...item, totalChapters: 0 };
        } catch (error) {
          console.error("載入章節失敗:", error);
          return { ...item, totalChapters: 0 };
        }
      })
    );

    setReadingList(listWithChapters);
    setLoading(false);
  };

  const getProgress = (readChapters, totalChapters) => {
    if (totalChapters === 0) return 0;
    return Math.round((readChapters.length / totalChapters) * 100);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}/${month}/${day}`;
    } catch {
      return dateString;
    }
  };

  const handleContinueReading = (item) => {
    const { novel, lastChapter } = item;
    if (lastChapter) {
      navigate(`/novel/${novel.id}/read/${lastChapter}`);
    } else {
      navigate(`/novel/${novel.id}/read/1`);
    }
  };

  if (loading) return <ProfileListSkeleton count={4} />;

  // 空狀態
  if (readingList.length === 0) {
    return (
      <div className="p-12 text-center rounded-2xl border
                      bg-white border-neutral-200
                      dark:bg-neutral-900 dark:border-neutral-800">
        <History className="w-12 h-12 mx-auto mb-4 text-neutral-300 dark:text-neutral-700" />
        <h2 className="text-xl font-semibold mb-2 text-neutral-900 dark:text-neutral-100">
          還沒有閱讀記錄
        </h2>
        <p className="mb-6 text-neutral-600 dark:text-neutral-400">
          開始閱讀你喜歡的小說,記錄會自動出現在這裡
        </p>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-3 rounded-lg font-semibold transition-colors
                     bg-primary text-white hover:bg-primary-dark"
        >
          去首頁看看
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 統計 */}
      <div className="text-sm text-neutral-600 dark:text-neutral-400">
        共閱讀{" "}
        <span className="font-semibold text-primary dark:text-primary-light">
          {readingList.length}
        </span>{" "}
        本小說
      </div>

      {/* 閱讀列表 */}
      <div className="space-y-4">
        {readingList.map((item) => {
          const progress = getProgress(item.readChapters, item.totalChapters);
          const isDefaultCover =
            !item.novel.coverImage || item.novel.coverImage === DEFAULT_COVER_PATH;
          return (
            <div
              key={item.novel.id}
              className="p-4 rounded-2xl border transition-all
                         bg-white border-neutral-200 hover:border-neutral-300
                         dark:bg-neutral-900 dark:border-neutral-800 dark:hover:border-neutral-700"
            >
              <div className="flex gap-4">
                {/* 封面縮圖 */}
                <div
                  className="flex-shrink-0 w-20 h-28 sm:w-24 sm:h-32 overflow-hidden rounded-md cursor-pointer
                             bg-neutral-100 dark:bg-neutral-800"
                  onClick={() => navigate(`/novel/${item.novel.id}`)}
                >
                  {isDefaultCover ? (
                    <DefaultCover
                      title={item.novel.title}
                      author={item.novel.author}
                      className="w-full h-full"
                    />
                  ) : (
                    <img
                      src={item.novel.coverImage}
                      alt={item.novel.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                  )}
                </div>

                {/* 資訊區 */}
                <div className="flex-1 min-w-0">
                  <h3
                    className="text-base sm:text-lg font-bold mb-1 break-words cursor-pointer transition-colors
                               text-neutral-900 hover:text-primary
                               dark:text-neutral-100 dark:hover:text-primary-light"
                    onClick={() => navigate(`/novel/${item.novel.id}`)}
                  >
                    {item.novel.title}
                  </h3>
                  <p className="mb-2 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                    作者:{item.novel.author}
                  </p>

                  {/* 閱讀進度 */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-neutral-600 dark:text-neutral-400">
                        已讀 {item.readChapters.length} / {item.totalChapters} 章
                      </span>
                      <span className="font-semibold text-primary dark:text-primary-light">
                        {progress}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full overflow-hidden
                                    bg-neutral-200 dark:bg-neutral-800">
                      <div
                        className="h-full transition-all duration-300 bg-primary dark:bg-primary-light"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm mb-3 text-neutral-500 dark:text-neutral-400">
                    最後閱讀:{formatDate(item.lastRead)}
                  </p>

                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    <button
                      onClick={() => handleContinueReading(item)}
                      className="px-4 py-2 text-sm font-medium rounded-lg transition-colors
                                 bg-primary text-white hover:bg-primary-dark"
                    >
                      {item.lastChapter ? "繼續閱讀" : "開始閱讀"}
                    </button>
                    <button
                      onClick={() => navigate(`/novel/${item.novel.id}`)}
                      className="px-4 py-2 text-sm font-medium rounded-lg transition-colors
                                 bg-neutral-100 text-neutral-700 hover:bg-neutral-200
                                 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
                    >
                      查看詳情
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
