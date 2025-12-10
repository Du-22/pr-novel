import React from "react";
import { Link } from "react-router-dom";

const RankingCard = ({ novel, rank, showStat, statValue }) => {
  // 排名徽章顏色 (前三名特殊樣式)
  const getRankBadgeStyle = () => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg scale-110";
      case 2:
        return "bg-gradient-to-br from-gray-300 to-gray-500 text-white shadow-md scale-105";
      case 3:
        return "bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-md";
      default:
        return "bg-gray-200 text-gray-700";
    }
  };

  // 統計數字標籤文字
  const getStatLabel = () => {
    switch (showStat) {
      case "views":
        return "閱讀";
      case "favorites":
        return "收藏";
      case "new":
        return "發布日期";
      default:
        return "";
    }
  };

  // 格式化日期 (支援多種格式)
  const formatDate = (dateString) => {
    if (!dateString) return "";

    try {
      // 如果是 ISO 格式 (例如 "2025-12-10T07:34:36.677Z")
      if (dateString.includes("T")) {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}/${month}/${day}`;
      }

      // 如果是簡單格式 (例如 "2024-06-15")
      return dateString.replace(/-/g, "/");
    } catch (error) {
      console.error("日期格式化失敗:", error);
      return dateString;
    }
  };

  return (
    <Link
      to={`/novel/${novel.id}`}
      className="block bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group"
    >
      <div className="flex gap-4 p-4">
        {/* 排名徽章 */}
        <div className="flex-shrink-0 flex items-center justify-center">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-transform ${getRankBadgeStyle()}`}
          >
            {rank}
          </div>
        </div>

        {/* 封面圖 */}
        <div className="flex-shrink-0 w-20 h-28 overflow-hidden rounded-md bg-gray-200">
          <img
            src={novel.coverImage}
            alt={novel.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* 內容區 */}
        <div className="flex-1 min-w-0">
          {/* 標題 */}
          <h3 className="text-lg font-bold text-dark mb-1 line-clamp-2 group-hover:text-primary transition-colors break-words">
            {novel.title}
          </h3>

          {/* 作者 */}
          <p className="text-sm text-gray-500 mb-2">{novel.author}</p>

          {/* 標籤 */}
          <div className="flex flex-wrap gap-1 mb-2">
            {novel.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-0.5 text-xs rounded-full bg-light text-primary border border-primary"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* 統計數字 */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            {/* 如果不是新書榜,顯示統計數字 */}
            {showStat !== "new" && (
              <div>
                <span className="font-semibold text-dark">{statValue}</span>{" "}
                <span className="text-gray-500">{getStatLabel()}</span>
              </div>
            )}

            {/* 如果是新書榜,顯示發布日期 */}
            {showStat === "new" && (
              <div>
                <span className="text-gray-500">{getStatLabel()}: </span>
                <span className="font-semibold text-dark">
                  {formatDate(novel.createdAt)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default RankingCard;
