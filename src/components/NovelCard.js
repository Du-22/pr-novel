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
        {/* 標題 */}
        <h3 className="text-lg font-bold text-dark mb-1 line-clamp-1 break-words">
          {novel.title}
        </h3>

        {/* 作者 */}
        <p className="text-sm text-gray-500 mb-2">{novel.author}</p>

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
