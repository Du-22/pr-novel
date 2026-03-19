// ============================================
// 檔案名稱: RatingInput.js
// 路徑: src/components/RatingInput.js
// 用途: 評分互動區（登入後可點星評分，可修改）
// ============================================
import React, { useState } from "react";

export default function RatingInput({ user, userRating, onRate, submitting }) {
  const [hoverRating, setHoverRating] = useState(0);

  const displayRating = hoverRating || userRating || 0;

  const statusText = () => {
    if (!user) return "登入後即可為這本小說評分";
    if (userRating !== null) return `你目前評了 ${userRating} 星，點擊星星可以修改`;
    if (hoverRating) return `評 ${hoverRating} 星`;
    return "點擊星星即可評分";
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-2xl font-bold text-dark mb-6">為這本小說評分</h2>

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
              className={`text-5xl leading-none transition-all ${
                user && !submitting
                  ? "cursor-pointer hover:scale-110 active:scale-95"
                  : "cursor-default"
              } ${star <= displayRating ? "text-yellow-400" : "text-gray-300"}`}
            >
              ★
            </button>
          ))}
        </div>

        {/* 狀態文字 */}
        <p className={`text-sm ${user && userRating !== null ? "text-primary" : "text-gray-400"}`}>
          {statusText()}
        </p>
      </div>
    </div>
  );
}
