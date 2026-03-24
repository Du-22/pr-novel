import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

export default function MyFavorites() {
  const navigate = useNavigate();
  const [favoriteNovels, setFavoriteNovels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("grid"); // "grid" | "list"

  // 載入收藏的小說
  useEffect(() => {
    loadFavorites();
  }, []);

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

  // 取消收藏
  const handleRemoveFavorite = async (novelId) => {
    const confirmRemove = window.confirm("確定要取消收藏嗎？");
    if (!confirmRemove) return;

    await removeFavorite(novelId);
    decrementNovelFavorites(novelId).catch(() => {});
    loadFavorites();
  };

  // 格式化日期
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

  if (loading) return <ProfileListSkeleton count={4} />;

  // 空狀態
  if (favoriteNovels.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <div className="text-6xl mb-4">💜</div>
        <h2 className="text-xl font-semibold text-dark mb-2">
          還沒有收藏任何小說
        </h2>
        <p className="text-gray-600 mb-6">
          快去探索喜歡的小說，點擊「加入收藏」按鈕吧！
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
      {/* 標題列 */}
      <div className="flex items-center justify-between">
        <div className="text-gray-600">
          共收藏{" "}
          <span className="font-semibold text-primary">
            {favoriteNovels.length}
          </span>{" "}
          本小說
        </div>
        <ViewToggle view={view} onChange={setView} />
      </div>

      {/* 格狀模式 */}
      {view === "grid" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {favoriteNovels.map((novel) => (
            <div key={novel.id} className="relative">
              <NovelCard novel={novel} />
              <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs text-gray-600">
                收藏於 {formatDate(novel.favoriteTime)}
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleRemoveFavorite(novel.id);
                }}
                className="absolute bottom-4 right-4 px-4 py-2 bg-red-500 text-white rounded-lg
                         hover:bg-red-600 transition-colors text-sm font-medium shadow-md hover:shadow-lg"
              >
                取消收藏
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 列表模式 */}
      {view === "list" && (
        <div className="space-y-2">
          {favoriteNovels.map((novel) => (
            <div key={novel.id} className="relative">
              <NovelListItem novel={novel} />
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleRemoveFavorite(novel.id);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-red-500 text-white
                         rounded-lg hover:bg-red-600 transition-colors text-xs font-medium shadow-sm"
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
