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
    <>
      {/* 遮罩層 */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onCancel}
      />

      {/* 對話框 */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-fadeIn"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 標題 */}
          <h3 className="text-xl font-bold text-dark mb-4">{title}</h3>

          {/* 訊息 */}
          <p className="text-gray-700 mb-6 leading-relaxed break-words">
            {message}
          </p>

          {/* 按鈕區 */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={onCancel}
              className="px-5 py-2.5 bg-gray-200 text-dark rounded-lg hover:bg-gray-300 
                       transition-colors font-medium"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className="px-5 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 
                       transition-colors font-medium"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </>
  );
}
