// ============================================
// 檔案名稱: RatingDisplay.js
// 路徑: src/components/RatingDisplay.js
// 用途: 評分純展示區（平均分 + 星星 + 人數）
// ============================================
import React from "react";

export default function RatingDisplay({ ratingSum, ratingCount }) {
  const avgRating =
    ratingCount > 0 ? (ratingSum / ratingCount).toFixed(1) : null;
  const filledStars = avgRating ? Math.round(Number(avgRating)) : 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-2xl font-bold text-dark mb-6">讀者評分</h2>

      {avgRating ? (
        <div className="flex items-center gap-8">
          {/* 左：大分數 */}
          <div className="flex-shrink-0 text-center min-w-[120px] px-4">
            <div className="text-7xl font-bold text-primary leading-none">
              {avgRating}
            </div>
            <div className="text-lg text-gray-400 mt-2">/ 5</div>
          </div>

          {/* 分隔線 */}
          <div className="w-px h-20 bg-gray-200 flex-shrink-0" />

          {/* 右：星星 + 人數 */}
          <div className="flex flex-col gap-3">
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`text-4xl leading-none ${
                    star <= filledStars ? "text-yellow-400" : "text-gray-300"
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
            <span className="text-base text-gray-500">
              共 <span className="font-semibold text-dark">{ratingCount}</span> 人評分
            </span>
          </div>
        </div>
      ) : (
        <p className="text-gray-400">尚無評分，成為第一個評分的人！</p>
      )}
    </div>
  );
}
