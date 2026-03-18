import React, { useState, useEffect, useRef } from "react";
import { getSyncStatus } from "../utils/favoritesManager";

export default function SyncIndicator() {
  const [syncStatus, setSyncStatus] = useState({
    isSyncing: false,
    lastSyncTime: null,
    error: null,
  });

  const [show, setShow] = useState(false);
  // 記錄已顯示過的 lastSyncTime，避免重複觸發
  const shownSyncTimeRef = useRef(null);

  // 每秒檢查同步狀態
  useEffect(() => {
    const interval = setInterval(() => {
      const status = getSyncStatus();
      setSyncStatus(status);

      if (status.isSyncing || status.error) {
        setShow(true);
      } else if (
        status.lastSyncTime &&
        status.lastSyncTime !== shownSyncTimeRef.current
      ) {
        // 只有新的 lastSyncTime 才觸發，避免重複顯示
        shownSyncTimeRef.current = status.lastSyncTime;
        setShow(true);
        setTimeout(() => setShow(false), 2000);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-fadeIn">
      {/* 同步中 */}
      {syncStatus.isSyncing && (
        <div className="flex items-center gap-2 px-4 py-3 bg-primary text-white rounded-lg shadow-lg">
          {/* 旋轉動畫 */}
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span className="font-medium">同步中...</span>
        </div>
      )}

      {/* 同步成功 */}
      {!syncStatus.isSyncing &&
        syncStatus.lastSyncTime &&
        !syncStatus.error && (
          <div className="flex items-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg shadow-lg">
            {/* 打勾圖示 */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="font-medium">同步完成</span>
          </div>
        )}

      {/* 同步失敗 */}
      {syncStatus.error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-500 text-white rounded-lg shadow-lg">
          {/* 警告圖示 */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <div className="font-medium">同步失敗</div>
            <div className="text-xs opacity-90">離線模式，資料已保存在本地</div>
          </div>
        </div>
      )}

      {/* 淡入動畫 */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
