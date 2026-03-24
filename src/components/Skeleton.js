// ============================================
// 檔案名稱: Skeleton.js
// 路徑: src/components/Skeleton.js
// 用途: Skeleton Loading 佔位元件（各頁面共用）
// ============================================

function SkeletonBlock({ className = "" }) {
  return <div className={`bg-gray-200 animate-pulse rounded ${className}`} />;
}

// 小說詳情頁骨架
export function NovelDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8 mb-10">
        {/* 封面 */}
        <SkeletonBlock className="w-48 h-64 flex-shrink-0 rounded-xl" />
        {/* 資訊區 */}
        <div className="flex-1 space-y-3">
          <SkeletonBlock className="h-8 w-3/4" />
          <SkeletonBlock className="h-4 w-1/3" />
          <div className="flex gap-2 py-1">
            <SkeletonBlock className="h-6 w-16 rounded-full" />
            <SkeletonBlock className="h-6 w-20 rounded-full" />
          </div>
          <SkeletonBlock className="h-4 w-full" />
          <SkeletonBlock className="h-4 w-full" />
          <SkeletonBlock className="h-4 w-2/3" />
          <SkeletonBlock className="h-10 w-36 rounded-lg mt-4" />
        </div>
      </div>
      {/* 章節目錄 */}
      <SkeletonBlock className="h-6 w-24 mb-4" />
      <div className="space-y-2">
        {[...Array(6)].map((_, i) => (
          <SkeletonBlock key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

// 閱讀頁骨架
export function ReadingPageSkeleton() {
  const lineWidths = ["w-full", "w-full", "w-5/6", "w-full", "w-full", "w-4/5",
                      "w-full", "w-full", "w-3/4", "w-full", "w-full", "w-5/6"];
  return (
    <div className="max-w-[800px] mx-auto px-4 py-8">
      <SkeletonBlock className="h-7 w-48 mx-auto mb-8" />
      <div className="space-y-3">
        {lineWidths.map((w, i) => (
          <SkeletonBlock key={i} className={`h-4 ${w}`} />
        ))}
      </div>
    </div>
  );
}

// 個人頁列表骨架（收藏、作品、閱讀記錄共用）
export function ProfileListSkeleton({ count = 4 }) {
  return (
    <div className="space-y-4">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="flex gap-4 bg-white rounded-xl p-4 shadow-sm">
          <SkeletonBlock className="w-16 h-20 flex-shrink-0 rounded" />
          <div className="flex-1 space-y-2">
            <SkeletonBlock className="h-4 w-2/3" />
            <SkeletonBlock className="h-3 w-1/3" />
            <SkeletonBlock className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
