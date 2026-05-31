// ============================================
// 檔案名稱: ChapterInfo.js
// 路徑: src/components/upload/ChapterInfo.js
// 用途: 章節資訊與管理列表(顯示章節數量、支援編輯/刪除)
//       單卷小說平鋪顯示;分卷小說依卷分組顯示
// ============================================

import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { deleteChapter } from "../../firebase/chapters";
import { formatChapterLabelText } from "../../utils/chapterLabel";

// 章節 link 建立 (含卷號識別 — 避免不同卷同 chapterNumber 撞 React key)
function chapterKey(ch) {
  return ch.volumeNumber != null
    ? `v${ch.volumeNumber}-${ch.chapterNumber}`
    : String(ch.chapterNumber);
}

function buildEditPath(novelId, ch) {
  return ch.volumeNumber != null
    ? `/my-uploads/edit/${novelId}/v/${ch.volumeNumber}/chapter/${ch.chapterNumber}`
    : `/my-uploads/edit/${novelId}/chapter/${ch.chapterNumber}`;
}

export default function ChapterInfo({
  chapters,
  novelId,
  isNewFormat,
  onChapterDeleted,
  volumes = null, // 分卷小說傳入 volumes 陣列;單卷不用傳
}) {
  const navigate = useNavigate();
  const [deletingKey, setDeletingKey] = useState(null);

  const isVolumed = Array.isArray(volumes) && volumes.length > 0;

  const getTotalWords = () => {
    if (!chapters || chapters.length === 0) return 0;
    return chapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0);
  };

  const handleDelete = async (chapter) => {
    const label = formatChapterLabelText(chapter);
    if (!window.confirm(`確定要刪除「${label}」嗎?此操作無法復原。`)) return;

    const key = chapterKey(chapter);
    setDeletingKey(key);
    try {
      await deleteChapter(
        novelId,
        chapter.chapterNumber,
        chapter.volumeNumber ?? null
      );
      const updated = chapters.filter((ch) => chapterKey(ch) !== key);
      if (onChapterDeleted) onChapterDeleted(updated);
    } catch (err) {
      console.error("刪除章節失敗:", err);
      alert("刪除失敗,請稍後再試");
    } finally {
      setDeletingKey(null);
    }
  };

  // 分卷小說:依 volumeNumber 分組(同 NovelDetailPage 邏輯)
  const groupedByVolume = useMemo(() => {
    if (!isVolumed) return null;
    const byVol = new Map();
    chapters.forEach((ch) => {
      const vol = ch.volumeNumber ?? 1;
      if (!byVol.has(vol)) byVol.set(vol, []);
      byVol.get(vol).push(ch);
    });
    return [...byVol.keys()].sort((a, b) => a - b).map((vol) => {
      const volInfo = volumes.find((v) => v.volumeNumber === vol);
      return {
        volumeNumber: vol,
        title: volInfo?.title || `卷 ${vol}`,
        chapters: byVol.get(vol).sort((a, b) => a.chapterNumber - b.chapterNumber),
      };
    });
  }, [chapters, volumes, isVolumed]);

  const renderRow = (ch) => {
    const key = chapterKey(ch);
    return (
      <div
        key={key}
        className="flex items-center justify-between gap-3 px-4 py-2 transition-colors
                   hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
      >
        <div className="flex-1 min-w-0">
          <span className="block text-sm truncate text-neutral-900 dark:text-neutral-100">
            {formatChapterLabelText(ch)}
          </span>
          <span className="text-xs text-neutral-400 dark:text-neutral-500">
            {(ch.wordCount || 0).toLocaleString()} 字
          </span>
        </div>
        {isNewFormat && (
          <div className="flex gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => navigate(buildEditPath(novelId, ch))}
              className="px-3 py-1 text-xs rounded transition-colors
                         bg-primary/10 text-primary hover:bg-primary/20
                         dark:bg-primary/20 dark:text-primary-light dark:hover:bg-primary/30"
            >
              編輯
            </button>
            <button
              type="button"
              onClick={() => handleDelete(ch)}
              disabled={deletingKey === key}
              className="px-3 py-1 text-xs rounded transition-colors
                         bg-danger-light text-danger hover:opacity-80
                         dark:bg-danger/15 dark:text-danger
                         disabled:opacity-50"
            >
              {deletingKey === key ? "刪除中" : "刪除"}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="rounded-2xl border p-5 sm:p-6
                    bg-white border-neutral-200
                    dark:bg-neutral-900 dark:border-neutral-800">
      <h2 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-neutral-100">
        章節管理
      </h2>

      {/* 統計 */}
      <div className="flex flex-wrap gap-4 sm:gap-6 mb-4 text-sm text-neutral-700 dark:text-neutral-300">
        {isVolumed && (
          <span>
            共{" "}
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">
              {volumes.length}
            </span>{" "}
            卷
          </span>
        )}
        <span>
          共{" "}
          <span className="font-semibold text-neutral-900 dark:text-neutral-100">
            {chapters.length}
          </span>{" "}
          章
        </span>
        <span>
          總字數:{" "}
          <span className="font-semibold text-neutral-900 dark:text-neutral-100">
            {getTotalWords().toLocaleString()}
          </span>{" "}
          字
        </span>
      </div>

      {chapters.length > 0 && !isVolumed && (
        // 單卷:平鋪列表
        <div className="border rounded-lg max-h-80 overflow-y-auto divide-y
                        border-neutral-200 divide-neutral-100
                        dark:border-neutral-800 dark:divide-neutral-800">
          {chapters.map(renderRow)}
        </div>
      )}

      {chapters.length > 0 && isVolumed && groupedByVolume && (
        // 分卷:每卷一塊,組標題顯示卷名
        <div className="space-y-3">
          {groupedByVolume.map((group) => (
            <div
              key={`group-${group.volumeNumber}`}
              className="border rounded-lg overflow-hidden
                         border-neutral-200 dark:border-neutral-800"
            >
              <div className="px-4 py-2 text-sm font-semibold
                              bg-neutral-50 text-neutral-900 border-b border-neutral-200
                              dark:bg-neutral-800/50 dark:text-neutral-100 dark:border-neutral-800">
                {group.title}{" "}
                <span className="font-normal text-neutral-500 dark:text-neutral-400">
                  ({group.chapters.length} 章)
                </span>
              </div>
              <div className="max-h-60 overflow-y-auto divide-y
                              divide-neutral-100 dark:divide-neutral-800">
                {group.chapters.map(renderRow)}
              </div>
            </div>
          ))}
        </div>
      )}

      {chapters.length === 0 && (
        <p className="text-sm text-neutral-400 dark:text-neutral-500">
          目前沒有章節
        </p>
      )}
    </div>
  );
}
