// ============================================
// 檔案名稱: RatingDisplay.js
// 路徑: src/components/RatingDisplay.js
// 用途: 評分純展示區(平均分 + 星星 + 人數)
// ============================================

import React from "react";
import { Star } from "lucide-react";

export default function RatingDisplay({ ratingSum, ratingCount }) {
  const avgRating =
    ratingCount > 0 ? (ratingSum / ratingCount).toFixed(1) : null;
  const filledStars = avgRating ? Math.round(Number(avgRating)) : 0;

  return (
    <div className="rounded-2xl border p-5 sm:p-6
                    bg-white border-neutral-200
                    dark:bg-neutral-900 dark:border-neutral-800">
      <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-6
                     text-neutral-900 dark:text-neutral-100">
        讀者評分
      </h2>

      {avgRating ? (
        <div className="flex items-center gap-6 sm:gap-8">
          {/* 左:大分數 */}
          <div className="flex-shrink-0 text-center min-w-[100px] sm:min-w-[120px] px-2 sm:px-4">
            <div className="text-6xl sm:text-7xl font-bold leading-none
                            text-primary dark:text-primary-light">
              {avgRating}
            </div>
            <div className="text-base sm:text-lg mt-2 text-neutral-400 dark:text-neutral-500">
              / 5
            </div>
          </div>

          {/* 分隔線 */}
          <div className="w-px h-20 flex-shrink-0 bg-neutral-200 dark:bg-neutral-800" />

          {/* 右:星星 + 人數 */}
          <div className="flex flex-col gap-3">
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-7 h-7 sm:w-9 sm:h-9 ${
                    star <= filledStars
                      ? "text-warm"
                      : "text-neutral-300 dark:text-neutral-700"
                  }`}
                  fill={star <= filledStars ? "currentColor" : "none"}
                  strokeWidth={1.5}
                />
              ))}
            </div>
            <span className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400">
              共{" "}
              <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                {ratingCount}
              </span>{" "}
              人評分
            </span>
          </div>
        </div>
      ) : (
        <p className="text-neutral-400 dark:text-neutral-500">
          尚無評分,成為第一個評分的人
        </p>
      )}
    </div>
  );
}
