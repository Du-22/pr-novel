// ============================================
// 檔案名稱: Skeleton.js
// 路徑: src/components/Skeleton.js
// 用途: Skeleton Loading 佔位元件(各頁面共用)
// ============================================

import React from "react";

function SkeletonBlock({ className = "" }) {
  return (
    <div
      className={`animate-pulse rounded
                  bg-neutral-200 dark:bg-neutral-800
                  ${className}`}
    />
  );
}

// 小說詳情頁骨架
export function NovelDetailSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
      <div className="rounded-2xl border p-5 sm:p-6 mb-6
                      bg-white border-neutral-200
                      dark:bg-neutral-900 dark:border-neutral-800">
        <div className="grid gap-6 md:gap-8 md:grid-cols-[280px_1fr]">
          {/* 封面 */}
          <SkeletonBlock className="aspect-[4/5] max-w-[240px] mx-auto md:max-w-none w-full rounded-lg" />
          {/* 資訊區 */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <SkeletonBlock className="h-6 w-16 rounded-full" />
              <SkeletonBlock className="h-6 w-20 rounded-full" />
            </div>
            <SkeletonBlock className="h-9 w-3/4" />
            <SkeletonBlock className="h-4 w-1/2" />
            <SkeletonBlock className="h-4 w-2/3" />
            <div className="flex gap-3 pt-2">
              <SkeletonBlock className="h-12 w-32 rounded-lg" />
              <SkeletonBlock className="h-12 w-32 rounded-lg" />
            </div>
          </div>
        </div>
      </div>

      {/* 章節目錄 */}
      <div className="rounded-2xl border p-5 sm:p-6
                      bg-white border-neutral-200
                      dark:bg-neutral-900 dark:border-neutral-800">
        <SkeletonBlock className="h-7 w-24 mb-4" />
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <SkeletonBlock key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

// 閱讀頁骨架
export function ReadingPageSkeleton() {
  const lineWidths = [
    "w-full", "w-full", "w-5/6", "w-full", "w-full", "w-4/5",
    "w-full", "w-full", "w-3/4", "w-full", "w-full", "w-5/6",
  ];
  return (
    <div className="max-w-[800px] mx-auto px-4 py-8 sm:py-10">
      <SkeletonBlock className="h-7 w-48 mx-auto mb-8" />
      <div className="space-y-3">
        {lineWidths.map((w, i) => (
          <SkeletonBlock key={i} className={`h-4 ${w}`} />
        ))}
      </div>
    </div>
  );
}

// 個人頁列表骨架(收藏 / 作品 / 閱讀記錄共用)
export function ProfileListSkeleton({ count = 4 }) {
  return (
    <div className="space-y-3 sm:space-y-4">
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl border
                     bg-white border-neutral-200
                     dark:bg-neutral-900 dark:border-neutral-800"
        >
          <SkeletonBlock className="w-20 h-28 sm:w-24 sm:h-32 flex-shrink-0 rounded-md" />
          <div className="flex-1 space-y-2">
            <SkeletonBlock className="h-5 w-2/3" />
            <SkeletonBlock className="h-3 w-1/3" />
            <SkeletonBlock className="h-3 w-1/2" />
            <SkeletonBlock className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
