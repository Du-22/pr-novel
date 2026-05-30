// ============================================
// 檔案名稱: chapterLabel.js
// 路徑: src/utils/chapterLabel.js
// 用途: 章節標題顯示格式化 — 全部章節統一「第N章 - {title}」格式
//       特殊章節（序章/番外/終章/後記）的 chapterNumber 在 parser 階段
//       已重編為連續數字（序章=0、正文 1..N、特殊章節從 N+1 開始）
//
// 使用方式:
//   const { prefix, title } = formatChapterLabel(chapter);
//   // 顯示: <span class="灰色">{prefix} - </span>{title}
// ============================================

/**
 * @param {object} chapter - { chapterNumber, title }
 * @returns {{ prefix: string, title: string }}
 */
export function formatChapterLabel(chapter) {
  if (!chapter) return { prefix: "", title: "" };
  return {
    prefix: `第${chapter.chapterNumber}章`,
    title: chapter.title || "",
  };
}

/**
 * 給不需要分前綴顏色的地方用（純字串）。
 * 例：通知 / 留言 metadata / alert / placeholder。
 *   - 有 title：「第3章 - title」（title 是原文 fallback 時也照樣顯示）
 *   - title 空：只顯示 prefix
 */
export function formatChapterLabelText(chapter) {
  const { prefix, title } = formatChapterLabel(chapter);
  if (!title) return prefix;
  return `${prefix} - ${title}`;
}
