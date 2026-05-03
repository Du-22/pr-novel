// ============================================
// 檔案名稱: RankingCard.js
// 路徑: src/components/RankingCard.js
// 用途: 排行榜卡片(排名徽章 + 封面 + 簡介 + 標籤 + 統計)
//       無封面時自動套用 DefaultCover
//       排名 1/2/3 維持金銀銅徽章(語意),4+ 改用中性 neutral
// ============================================

import React from "react";
import { Link } from "react-router-dom";
import DefaultCover from "./DefaultCover";

const DEFAULT_COVER_PATH = "/images/covers/default-cover.png";

const RankingCard = ({ novel, rank }) => {
  const isDefaultCover =
    !novel.coverImage || novel.coverImage === DEFAULT_COVER_PATH;

  // 排名徽章樣式 — 1/2/3 維持金銀銅(直覺、有語意),4+ 用 neutral
  const getRankBadgeStyle = () => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg scale-110";
      case 2:
        return "bg-gradient-to-br from-neutral-300 to-neutral-500 text-white shadow-md scale-105";
      case 3:
        return "bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-md";
      default:
        return "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300";
    }
  };

  const formatDate = (val) => {
    if (!val) return "";
    try {
      const date =
        typeof val.toDate === "function" ? val.toDate() : new Date(val);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}/${month}/${day}`;
    } catch {
      return "";
    }
  };

  return (
    <Link
      to={`/novel/${novel.id}`}
      className="group flex gap-3 sm:gap-4 items-start p-3 sm:p-4 rounded-xl border transition-all
                 bg-white border-neutral-200 hover:shadow-md hover:border-neutral-300
                 dark:bg-neutral-900 dark:border-neutral-800 dark:hover:border-neutral-700"
    >
      {/* 排名徽章 */}
      <div className="flex-shrink-0 flex items-center justify-center self-center">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-base transition-transform ${getRankBadgeStyle()}`}
        >
          {rank}
        </div>
      </div>

      {/* 封面縮圖 */}
      <div className="flex-shrink-0 w-20 h-28 sm:w-24 sm:h-32 overflow-hidden rounded-md
                      bg-neutral-100 dark:bg-neutral-800">
        {isDefaultCover ? (
          <DefaultCover
            title={novel.title}
            author={novel.author}
            className="w-full h-full"
          />
        ) : (
          <img
            src={novel.coverImage}
            alt={novel.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        )}
      </div>

      {/* 資訊區 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 mb-1">
          <h3 className="flex-1 text-base sm:text-lg font-bold line-clamp-1 break-words
                         text-neutral-900 group-hover:text-primary transition-colors
                         dark:text-neutral-100 dark:group-hover:text-primary-light">
            {novel.title}
          </h3>
          {novel.status && (
            <span
              className={`flex-shrink-0 text-[11px] px-1.5 py-0.5 rounded font-medium ${
                novel.status === "completed"
                  ? "bg-info-light text-info"
                  : "bg-success-light text-success"
              }`}
            >
              {novel.status === "completed" ? "完結" : "連載"}
            </span>
          )}
        </div>
        <p className="mb-2 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
          {novel.author}
        </p>
        <p className="mb-2 text-xs sm:text-sm line-clamp-2 leading-relaxed break-words
                      text-neutral-600 dark:text-neutral-400">
          {novel.summary}
        </p>

        {/* 標籤 */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {(novel.tags || []).slice(0, 4).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-0.5 text-[11px] rounded-full
                         bg-neutral-100 text-neutral-700
                         dark:bg-neutral-800 dark:text-neutral-300"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* 統計數字 */}
        <div className="flex gap-3 sm:gap-4 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
          <span>{novel.stats?.views || 0} 閱讀</span>
          <span>{novel.stats?.favorites || 0} 收藏</span>
          {novel.createdAt && (
            <span className="hidden sm:inline">
              上架 {formatDate(novel.createdAt)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default RankingCard;
