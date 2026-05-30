// ============================================
// 檔案名稱: MyFavorites.js
// 路徑: src/components/profile/MyFavorites.js
// 用途: 個人中心「我的收藏」Tab — 顯示收藏的小說 (grid/list 切換) + 取消收藏
// ============================================

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import NovelCard from "../NovelCard";
import NovelListItem from "../NovelListItem";
import ViewToggle from "../ViewToggle";
import {
  getFavoriteNovelIds,
  removeFavorite,
  getFavoriteTimestamp,
} from "../../utils/favoritesManager";
import { getAllNovels } from "../../utils/novelsHelper";
import { decrementNovelFavorites } from "../../firebase/novels";
import { ProfileListSkeleton } from "../Skeleton";
import { useAuth } from "../../hooks/useAuth";

export default function MyFavorites() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [favoriteNovels, setFavoriteNovels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("grid");

  useEffect(() => {
    if (user) loadFavorites();
    else setLoading(false);
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadFavorites = async () => {
    setLoading(true);
    const favoriteIds = await getFavoriteNovelIds();
    const allNovels = getAllNovels();

    const novels = (
      await Promise.all(
        favoriteIds.map(async (id) => {
          const novel = allNovels.find((n) => n.id === id);
          if (novel) {
            return {
              ...novel,
              favoriteTime: await getFavoriteTimestamp(id),
            };
          }
          return null;
        })
      )
    ).filter((novel) => novel !== null);

    setFavoriteNovels(novels);
    setLoading(false);
  };

  const handleRemoveFavorite = async (novelId) => {
    const confirmRemove = window.confirm("確定要取消收藏嗎?");
    if (!confirmRemove) return;

    await removeFavorite(novelId);
    decrementNovelFavorites(novelId).catch(() => {});
    loadFavorites();
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

  // 未登入訊息卡(比照 MyWorks)
  if (!user) {
    return (
      <div className="p-12 text-center rounded-2xl border
                      bg-white border-neutral-200
                      dark:bg-neutral-900 dark:border-neutral-800">
        <p className="text-neutral-600 dark:text-neutral-400">
          請先登入才能查看我的收藏
        </p>
      </div>
    );
  }

  if (loading) return <ProfileListSkeleton count={4} />;

  // 空狀態
  if (favoriteNovels.length === 0) {
    return (
      <div className="p-12 text-center rounded-2xl border
                      bg-white border-neutral-200
                      dark:bg-neutral-900 dark:border-neutral-800">
        <Heart className="w-12 h-12 mx-auto mb-4 text-neutral-300 dark:text-neutral-700" />
        <h2 className="text-xl font-semibold mb-2 text-neutral-900 dark:text-neutral-100">
          還沒有收藏任何小說
        </h2>
        <p className="mb-6 text-neutral-600 dark:text-neutral-400">
          快去探索喜歡的小說,點擊「加入收藏」按鈕吧
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
      {/* 標題列 */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-neutral-600 dark:text-neutral-400">
          共收藏{" "}
          <span className="font-semibold text-primary dark:text-primary-light">
            {favoriteNovels.length}
          </span>{" "}
          本小說
        </div>
        <ViewToggle view={view} onChange={setView} />
      </div>

      {/* 格狀模式 */}
      {view === "grid" && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {favoriteNovels.map((novel) => (
            <div key={novel.id} className="relative">
              <NovelCard novel={novel} />
              <div className="absolute top-2 right-2 px-2 py-1 rounded-md text-xs backdrop-blur-sm
                              bg-white/90 text-neutral-600
                              dark:bg-neutral-900/90 dark:text-neutral-300">
                收藏於 {formatDate(novel.favoriteTime)}
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleRemoveFavorite(novel.id);
                }}
                className="absolute bottom-4 right-4 px-3 py-1.5 text-xs font-medium rounded-lg shadow-md transition-colors
                           bg-danger text-white hover:opacity-90"
              >
                取消收藏
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 列表模式 */}
      {view === "list" && (
        <div className="space-y-3">
          {favoriteNovels.map((novel) => (
            <div key={novel.id} className="relative">
              <NovelListItem novel={novel} />
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleRemoveFavorite(novel.id);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 text-xs font-medium rounded-lg shadow-sm transition-colors
                           bg-danger text-white hover:opacity-90"
              >
                取消收藏
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
