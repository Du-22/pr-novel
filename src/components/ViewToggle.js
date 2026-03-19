// ============================================
// 檔案名稱: ViewToggle.js
// 路徑: src/components/ViewToggle.js
// 用途: 格狀/列表視圖切換按鈕
// ============================================
import React from "react";

export default function ViewToggle({ view, onChange }) {
  return (
    <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
      {/* 格狀 */}
      <button
        onClick={() => onChange("grid")}
        title="格狀顯示"
        className={`p-1.5 rounded-md transition-colors ${
          view === "grid"
            ? "bg-white text-primary shadow-sm"
            : "text-gray-400 hover:text-gray-600"
        }`}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <rect x="1" y="1" width="6" height="6" rx="1" />
          <rect x="9" y="1" width="6" height="6" rx="1" />
          <rect x="1" y="9" width="6" height="6" rx="1" />
          <rect x="9" y="9" width="6" height="6" rx="1" />
        </svg>
      </button>
      {/* 列表 */}
      <button
        onClick={() => onChange("list")}
        title="列表顯示"
        className={`p-1.5 rounded-md transition-colors ${
          view === "list"
            ? "bg-white text-primary shadow-sm"
            : "text-gray-400 hover:text-gray-600"
        }`}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <rect x="1" y="2" width="14" height="2.5" rx="1" />
          <rect x="1" y="6.75" width="14" height="2.5" rx="1" />
          <rect x="1" y="11.5" width="14" height="2.5" rx="1" />
        </svg>
      </button>
    </div>
  );
}
