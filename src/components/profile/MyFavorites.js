import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NovelCard from "../NovelCard";
import {
  getFavoriteNovelIds,
  removeFavorite,
  getFavoriteTimestamp,
} from "../../utils/favoritesManager";
import { getAllNovels } from "../../utils/novelsHelper";
import { decrementFavorites } from "../../utils/statsManager";

export default function MyFavorites() {
  const navigate = useNavigate();
  const [favoriteNovels, setFavoriteNovels] = useState([]);

  // 載入收藏的小說
  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = () => {
    const favoriteIds = getFavoriteNovelIds();
    const allNovels = getAllNovels();

    // 根據收藏的 ID 找出對應的小說
    const novels = favoriteIds
      .map((id) => {
        const novel = allNovels.find((n) => n.id === id);
        if (novel) {
          return {
            ...novel,
            favoriteTime: getFavoriteTimestamp(id),
          };
        }
        return null;
      })
      .filter((novel) => novel !== null);

    setFavoriteNovels(novels);
  };

  // 取消收藏
  const handleRemoveFavorite = (novelId) => {
    const confirmRemove = window.confirm("確定要取消收藏嗎？");
    if (!confirmRemove) return;

    // 從收藏列表移除
    removeFavorite(novelId);

    // 更新統計數據
    decrementFavorites(novelId);

    // 重新載入收藏列表
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
      {/* 收藏數量提示 */}
      <div className="text-gray-600">
        共收藏{" "}
        <span className="font-semibold text-primary">
          {favoriteNovels.length}
        </span>{" "}
        本小說
      </div>

      {/* 小說列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {favoriteNovels.map((novel) => (
          <div key={novel.id} className="relative">
            {/* 使用 NovelCard 元件 */}
            <NovelCard novel={novel} />

            {/* 收藏時間 */}
            <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs text-gray-600">
              收藏於 {formatDate(novel.favoriteTime)}
            </div>

            {/* 取消收藏按鈕 */}
            <button
              onClick={(e) => {
                e.preventDefault();
                handleRemoveFavorite(novel.id);
              }}
              className="absolute bottom-4 right-4 px-4 py-2 bg-red-500 text-white rounded-lg 
                       hover:bg-red-600 transition-colors text-sm font-medium shadow-md
                       hover:shadow-lg"
            >
              取消收藏
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
