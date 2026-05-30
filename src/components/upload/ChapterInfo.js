// ============================================
// 檔案名稱: ChapterInfo.js
// 路徑: src/components/upload/ChapterInfo.js
// 用途: 章節資訊與管理列表(顯示章節數量、支援編輯/刪除)
// ============================================

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteChapter } from "../../firebase/chapters";
import { formatChapterLabelText } from "../../utils/chapterLabel";

export default function ChapterInfo({
  chapters,
  novelId,
  isNewFormat,
  onChapterDeleted,
}) {
  const navigate = useNavigate();
  const [deletingNum, setDeletingNum] = useState(null);

  const getTotalWords = () => {
    if (!chapters || chapters.length === 0) return 0;
    return chapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0);
  };

  const handleDelete = async (chapter) => {
    const label = formatChapterLabelText(chapter);
    if (!window.confirm(`確定要刪除「${label}」嗎?此操作無法復原。`)) return;

    setDeletingNum(chapter.chapterNumber);
    try {
      await deleteChapter(novelId, chapter.chapterNumber);
      const updated = chapters.filter(
        (ch) => ch.chapterNumber !== chapter.chapterNumber
      );
      if (onChapterDeleted) onChapterDeleted(updated);
    } catch (err) {
      console.error("刪除章節失敗:", err);
      alert("刪除失敗,請稍後再試");
    } finally {
      setDeletingNum(null);
    }
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

      {chapters.length > 0 && (
        <div className="border rounded-lg max-h-80 overflow-y-auto divide-y
                        border-neutral-200 divide-neutral-100
                        dark:border-neutral-800 dark:divide-neutral-800">
          {chapters.map((ch) => (
            <div
              key={ch.chapterNumber}
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
                    onClick={() =>
                      navigate(`/my-uploads/edit/${novelId}/chapter/${ch.chapterNumber}`)
                    }
                    className="px-3 py-1 text-xs rounded transition-colors
                               bg-primary/10 text-primary hover:bg-primary/20
                               dark:bg-primary/20 dark:text-primary-light dark:hover:bg-primary/30"
                  >
                    編輯
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(ch)}
                    disabled={deletingNum === ch.chapterNumber}
                    className="px-3 py-1 text-xs rounded transition-colors
                               bg-danger-light text-danger hover:opacity-80
                               dark:bg-danger/15 dark:text-danger
                               disabled:opacity-50"
                  >
                    {deletingNum === ch.chapterNumber ? "刪除中" : "刪除"}
                  </button>
                </div>
              )}
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
