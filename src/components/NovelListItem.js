// ============================================
// 檔案名稱: NovelListItem.js
// 路徑: src/components/NovelListItem.js
// 用途: 列表模式的小說卡片（封面＋簡介＋類別＋統計）
// ============================================
import React from "react";
import { Link } from "react-router-dom";

export default function NovelListItem({ novel }) {
  return (
    <Link
      to={`/novel/${novel.id}`}
      className="flex gap-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 items-start"
    >
      {/* 封面縮圖 */}
      <div className="flex-shrink-0 w-24 h-32 overflow-hidden rounded-md bg-gray-200">
        <img
          src={novel.coverImage}
          alt={novel.title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* 資訊區 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 mb-1">
          <h3 className="text-lg font-bold text-dark line-clamp-1 break-words flex-1">
            {novel.title}
          </h3>
          {novel.status && (
            <span className={`flex-shrink-0 text-xs px-1.5 py-0.5 rounded font-medium ${
              novel.status === "completed"
                ? "bg-blue-50 text-blue-600"
                : "bg-green-50 text-green-600"
            }`}>
              {novel.status === "completed" ? "完結" : "連載"}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 mb-2">{novel.author}</p>
        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed break-words mb-2">
          {novel.summary}
        </p>

        {/* 標籤 */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {(novel.tags || []).slice(0, 4).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-0.5 text-xs rounded-full bg-light text-primary border border-primary"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* 統計數字 */}
        <div className="flex gap-4 text-sm text-gray-500">
          <span>{novel.stats?.views || 0} 閱讀</span>
          <span>{novel.stats?.favorites || 0} 收藏</span>
        </div>
      </div>
    </Link>
  );
}
