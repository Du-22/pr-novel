// ============================================
// 檔案名稱: ViewToggle.js
// 路徑: src/components/ViewToggle.js
// 用途: 格狀 / 列表視圖切換按鈕
// ============================================

import React from "react";
import { LayoutGrid, List } from "lucide-react";

export default function ViewToggle({ view, onChange }) {
  const baseBtn =
    "p-1.5 rounded-md transition-all flex items-center justify-center";
  const activeBtn =
    "bg-white text-primary shadow-sm dark:bg-neutral-700 dark:text-primary-light";
  const inactiveBtn =
    "text-neutral-400 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-200";

  return (
    <div className="flex gap-1 rounded-lg p-1 bg-neutral-100 dark:bg-neutral-800">
      <button
        onClick={() => onChange("grid")}
        title="格狀顯示"
        aria-label="格狀顯示"
        className={`${baseBtn} ${view === "grid" ? activeBtn : inactiveBtn}`}
      >
        <LayoutGrid className="w-4 h-4" />
      </button>
      <button
        onClick={() => onChange("list")}
        title="列表顯示"
        aria-label="列表顯示"
        className={`${baseBtn} ${view === "list" ? activeBtn : inactiveBtn}`}
      >
        <List className="w-4 h-4" />
      </button>
    </div>
  );
}
