import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAllReadHistory } from "../../utils/readHistoryManager";
import { getBookmark } from "../../utils/bookmarkManager";
import { getAllNovels } from "../../utils/novelsHelper";
import { parseNovelChapters } from "../../utils/parser";

export default function ReadingHistory() {
  const navigate = useNavigate();
  const [readingList, setReadingList] = useState([]);
  const [loading, setLoading] = useState(true);

  // 載入閱讀記錄
  useEffect(() => {
    loadReadingHistory();
  }, []);

  const loadReadingHistory = async () => {
    setLoading(true);

    const history = getAllReadHistory();
    const allNovels = getAllNovels();

    // 將閱讀記錄轉換成陣列並按最後閱讀時間排序
    const historyArray = Object.keys(history)
      .map((novelId) => {
        const novel = allNovels.find((n) => n.id === novelId);
        if (!novel) return null;

        const record = history[novelId];
        const bookmark = getBookmark(novelId);

        return {
          novel,
          readChapters: record.readChapters || [],
          lastRead: record.lastRead,
          bookmark,
        };
      })
      .filter((item) => item !== null)
      .sort((a, b) => new Date(b.lastRead) - new Date(a.lastRead));

    // 載入每本小說的章節資訊
    const listWithChapters = await Promise.all(
      historyArray.map(async (item) => {
        try {
          // 如果有 txtFile，載入章節
          if (item.novel.txtFile) {
            const response = await fetch(item.novel.txtFile);
            const txtContent = await response.text();
            const chapters = parseNovelChapters(txtContent);
            return { ...item, totalChapters: chapters.length };
          } else if (item.novel.chapters) {
            // 上傳的小說直接使用 chapters
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

  // 計算閱讀進度
  const getProgress = (readChapters, totalChapters) => {
    if (totalChapters === 0) return 0;
    return Math.round((readChapters.length / totalChapters) * 100);
  };

  // 格式化時間（固定日期格式）
  const formatDate = (dateString) => {
    if (!dateString) return "";

    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}/${month}/${day}`;
    } catch (error) {
      return dateString;
    }
  };

  // 繼續閱讀
  const handleContinueReading = (item) => {
    const { novel, bookmark, readChapters } = item;

    // 如果有書籤，跳到書籤位置
    if (bookmark && bookmark.chapter) {
      navigate(`/novel/${novel.id}/read/${bookmark.chapter}`);
      return;
    }

    // 沒有書籤，找出下一章
    if (readChapters.length > 0) {
      const lastRead = Math.max(...readChapters);
      navigate(`/novel/${novel.id}/read/${lastRead + 1}`);
    } else {
      // 從第一章開始
      navigate(`/novel/${novel.id}/read/1`);
    }
  };

  // 空狀態
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <p className="text-gray-500">載入中...</p>
      </div>
    );
  }

  if (readingList.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <div className="text-6xl mb-4">📖</div>
        <h2 className="text-xl font-semibold text-dark mb-2">還沒有閱讀記錄</h2>
        <p className="text-gray-600 mb-6">
          開始閱讀你喜歡的小說，記錄會自動出現在這裡！
        </p>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 
                   transition-colors font-semibold"
        >
          去首頁看看
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 閱讀記錄數量提示 */}
      <div className="text-gray-600">
        共閱讀{" "}
        <span className="font-semibold text-primary">{readingList.length}</span>{" "}
        本小說
      </div>

      {/* 閱讀列表 */}
      <div className="space-y-4">
        {readingList.map((item) => {
          const progress = getProgress(item.readChapters, item.totalChapters);

          return (
            <div
              key={item.novel.id}
              className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
            >
              <div className="flex gap-4">
                {/* 封面縮圖 */}
                <div
                  className="flex-shrink-0 w-24 h-32 overflow-hidden rounded-md bg-gray-200 cursor-pointer"
                  onClick={() => navigate(`/novel/${item.novel.id}`)}
                >
                  <img
                    src={item.novel.coverImage}
                    alt={item.novel.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                </div>

                {/* 資訊區 */}
                <div className="flex-1 min-w-0">
                  {/* 標題 + 作者 */}
                  <h3
                    className="text-lg font-bold text-dark mb-1 break-words cursor-pointer hover:text-primary"
                    onClick={() => navigate(`/novel/${item.novel.id}`)}
                  >
                    {item.novel.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-2">
                    作者：{item.novel.author}
                  </p>

                  {/* 閱讀進度 */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">
                        已讀 {item.readChapters.length} / {item.totalChapters}{" "}
                        章
                      </span>
                      <span className="font-semibold text-primary">
                        {progress}%
                      </span>
                    </div>
                    {/* 進度條 */}
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-primary h-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* 最後閱讀時間 */}
                  <p className="text-sm text-gray-500 mb-3">
                    最後閱讀：{formatDate(item.lastRead)}
                  </p>

                  {/* 操作按鈕 */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleContinueReading(item)}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 
                               transition-colors text-sm font-medium"
                    >
                      {item.bookmark ? "繼續閱讀" : "開始閱讀"}
                    </button>
                    <button
                      onClick={() => navigate(`/novel/${item.novel.id}`)}
                      className="px-4 py-2 bg-gray-200 text-dark rounded-lg hover:bg-gray-300 
                               transition-colors text-sm font-medium"
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
