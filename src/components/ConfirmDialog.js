// ============================================
// 檔案名稱: ConfirmDialog.js
// 路徑: src/components/ConfirmDialog.js
// 用途: 通用「確認 / 取消」對話框 (用於刪除小說等需要使用者確認的操作)
// ============================================

import React from "react";

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = "確定",
  cancelText = "取消",
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md p-6 rounded-2xl shadow-2xl
                   bg-white dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold mb-4 text-neutral-900 dark:text-neutral-100">
          {title}
        </h3>

        <p className="mb-6 leading-relaxed break-words text-neutral-700 dark:text-neutral-300">
          {message}
        </p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-lg font-medium transition-colors
                       bg-neutral-100 text-neutral-700 hover:bg-neutral-200
                       dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-lg font-medium transition-colors
                       bg-danger text-white hover:opacity-90"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
