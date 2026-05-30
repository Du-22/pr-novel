// ============================================
// 檔案名稱: ChapterPreview.js
// 路徑: src/components/upload/ChapterPreview.js
// 用途: TXT 解析後的章節列表預覽(顯示章節標題與字數)
// ============================================

import React from "react";
import { formatChapterLabelText } from "../../utils/chapterLabel";

export default function ChapterPreview({ chapters }) {
  return (
    <div className="mt-4 max-h-60 overflow-y-auto space-y-1">
      {chapters.map((ch, idx) => (
        <div
          key={idx}
          className="py-1 text-sm border-b
                     text-neutral-700 border-neutral-200
                     dark:text-neutral-300 dark:border-neutral-800"
        >
          {formatChapterLabelText(ch)} ({ch.wordCount?.toLocaleString() || 0} 字)
        </div>
      ))}
    </div>
  );
}
