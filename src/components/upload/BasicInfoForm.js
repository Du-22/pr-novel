import React from "react";

export default function BasicInfoForm({
  title,
  author,
  summary,
  tags,
  onTitleChange,
  onAuthorChange,
  onSummaryChange,
  onTagsChange,
}) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
      <h2 className="text-xl font-semibold text-dark mb-4">基本資訊</h2>

      {/* 標題 */}
      <div>
        <label className="block text-sm font-medium text-dark mb-2">
          小說標題 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="例如: 七彩魔女學徒"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 
                   focus:ring-primary focus:border-transparent"
          required
        />
      </div>

      {/* 作者 */}
      <div>
        <label className="block text-sm font-medium text-dark mb-2">
          作者 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={author}
          onChange={(e) => onAuthorChange(e.target.value)}
          placeholder="例如: 陳默"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 
                   focus:ring-primary focus:border-transparent"
          required
        />
      </div>

      {/* 簡介 */}
      <div>
        <label className="block text-sm font-medium text-dark mb-2">
          故事簡介 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={summary}
          onChange={(e) => onSummaryChange(e.target.value)}
          placeholder="請輸入 50-200 字的故事簡介..."
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 
                   focus:ring-primary focus:border-transparent resize-none"
          required
        />
        <div className="mt-1 text-sm text-gray-500 text-right">
          {summary.length} 字
        </div>
      </div>

      {/* 標籤 */}
      <div>
        <label className="block text-sm font-medium text-dark mb-2">
          標籤 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={tags}
          onChange={(e) => onTagsChange(e.target.value)}
          placeholder="用逗號分隔,例如: 奇幻,冒險,校園"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 
                   focus:ring-primary focus:border-transparent"
          required
        />
        <div className="mt-1 text-sm text-gray-500">
          建議 2-3 個標籤,用中文逗號或英文逗號分隔
        </div>
      </div>
    </div>
  );
}
