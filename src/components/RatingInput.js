// ============================================
// 檔案名稱: RatingInput.js
// 路徑: src/components/RatingInput.js
// 用途: 評分互動區(登入後可點星評分,可修改)
// ============================================

import React, { useState } from "react";
import { Star } from "lucide-react";

export default function RatingInput({ user, userRating, onRate, submitting }) {
  const [hoverRating, setHoverRating] = useState(0);

  const displayRating = hoverRating || userRating || 0;

  const statusText = () => {
    if (!user) return "登入後即可為這本小說評分";
    if (userRating !== null) return `你目前評了 ${userRating} 星,點擊星星可以修改`;
    if (hoverRating) return `評 ${hoverRating} 星`;
    return "點擊星星即可評分";
  };

  return (
    <div className="rounded-2xl border p-5 sm:p-6
                    bg-white border-neutral-200
                    dark:bg-neutral-900 dark:border-neutral-800">
      <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-6
                     text-neutral-900 dark:text-neutral-100">
        為這本小說評分
      </h2>

      <div className="flex flex-col gap-4">
        {/* 星星 */}
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => user && !submitting && onRate(star)}
              onMouseEnter={() => user && setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              disabled={!user || submitting}
              className={`transition-all ${
                user && !submitting
                  ? "cursor-pointer hover:scale-110 active:scale-95"
                  : "cursor-default"
              }`}
              aria-label={`評 ${star} 星`}
            >
              <Star
                className={`w-10 h-10 sm:w-12 sm:h-12 ${
                  star <= displayRating
                    ? "text-warm"
                    : "text-neutral-300 dark:text-neutral-700"
                }`}
                fill={star <= displayRating ? "currentColor" : "none"}
                strokeWidth={1.5}
              />
            </button>
          ))}
        </div>

        {/* 狀態文字 */}
        <p
          className={`text-sm ${
            user && userRating !== null
              ? "text-primary dark:text-primary-light"
              : "text-neutral-400 dark:text-neutral-500"
          }`}
        >
          {statusText()}
        </p>
      </div>
    </div>
  );
}
