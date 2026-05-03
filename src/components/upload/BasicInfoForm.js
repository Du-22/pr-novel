// ============================================
// 檔案名稱: BasicInfoForm.js
// 路徑: src/components/upload/BasicInfoForm.js
// 用途: 上傳 / 編輯小說的基本資訊表單(標題、作者、譯者、簡介、標籤)
// ============================================

import React from "react";

const INPUT_CLASS =
  "w-full px-4 py-2 rounded-lg border " +
  "bg-white text-neutral-900 placeholder-neutral-400 border-neutral-300 " +
  "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 " +
  "dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500 dark:border-neutral-700";

const LABEL_CLASS =
  "block text-sm font-medium mb-2 text-neutral-900 dark:text-neutral-100";

export default function BasicInfoForm({
  title,
  author,
  translator,
  summary,
  tags,
  onTitleChange,
  onAuthorChange,
  onTranslatorChange,
  onSummaryChange,
  onTagsChange,
}) {
  return (
    <div className="rounded-2xl border p-5 sm:p-6 space-y-4
                    bg-white border-neutral-200
                    dark:bg-neutral-900 dark:border-neutral-800">
      <h2 className="text-lg font-semibold mb-2 text-neutral-900 dark:text-neutral-100">
        基本資訊
      </h2>

      {/* 標題 */}
      <div>
        <label className={LABEL_CLASS}>
          小說標題 <span className="text-danger">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="例如: 七彩魔女學徒"
          className={INPUT_CLASS}
          required
        />
      </div>

      {/* 作者 */}
      <div>
        <label className={LABEL_CLASS}>
          作者 <span className="text-danger">*</span>
        </label>
        <input
          type="text"
          value={author}
          onChange={(e) => onAuthorChange(e.target.value)}
          placeholder="例如: 陳默"
          className={INPUT_CLASS}
          required
        />
      </div>

      {/* 譯者/上傳者 */}
      <div>
        <label className={LABEL_CLASS}>
          譯者/上傳者{" "}
          <span className="text-xs font-normal text-neutral-400 dark:text-neutral-500">
            (選填)
          </span>
        </label>
        <input
          type="text"
          value={translator}
          onChange={(e) => onTranslatorChange(e.target.value)}
          placeholder="若與原作者不同,請填寫譯者或搬運者名稱"
          className={INPUT_CLASS}
        />
      </div>

      {/* 簡介 */}
      <div>
        <label className={LABEL_CLASS}>
          故事簡介 <span className="text-danger">*</span>
        </label>
        <textarea
          value={summary}
          onChange={(e) => onSummaryChange(e.target.value)}
          placeholder="請輸入 50-200 字的故事簡介..."
          rows={4}
          className={`${INPUT_CLASS} resize-none`}
          required
        />
        <div className="mt-1 text-sm text-right text-neutral-500 dark:text-neutral-400">
          {summary.length} 字
        </div>
      </div>

      {/* 標籤 */}
      <div>
        <label className={LABEL_CLASS}>
          標籤 <span className="text-danger">*</span>
        </label>
        <input
          type="text"
          value={tags}
          onChange={(e) => onTagsChange(e.target.value)}
          placeholder="用逗號分隔,例如: 奇幻,冒險,校園"
          className={INPUT_CLASS}
          required
        />
        <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          建議 2-3 個標籤,用中文逗號或英文逗號分隔
        </div>
      </div>
    </div>
  );
}
