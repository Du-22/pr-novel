import React from "react";
import { Link } from "react-router-dom";

const NovelCard = ({ novel }) => {
  return (
    <Link
      to={`/novel/${novel.id}`}
      className="block bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden"
    >
      {/* 封面圖 */}
      <div className="aspect-[4/5] overflow-hidden bg-gray-200">
        <img
          src={novel.coverImage}
          alt={novel.title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* 內容區 */}
      <div className="p-4">
        {/* 標題 + 狀態 */}
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

        {/* 作者 / 譯者 */}
        <p className="text-sm text-gray-500 mb-2">
          {novel.author}
          {novel.translator && (
            <span className="text-gray-400"> · 譯: {novel.translator}</span>
          )}
        </p>

        {/* 簡介 */}
        <p className="text-sm text-gray-600 mb-3 line-clamp-3 leading-relaxed break-words">
          {novel.summary}
        </p>

        {/* 標籤 */}
        <div className="flex flex-wrap gap-2">
          {novel.tags.map((tag, index) => (
            <span
              key={index}
              className="px-3 py-1 text-xs rounded-full bg-light text-primary border border-primary"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
};

export default NovelCard;
