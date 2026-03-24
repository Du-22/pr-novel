// ============================================
// 檔案名稱: NotificationsPage.js
// 路徑: src/pages/NotificationsPage.js
// 用途: 通知列表頁（回覆、按讚）
// ============================================
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../hooks/useAuth";
import {
  getNotifications,
  markAllNotificationsAsRead,
} from "../firebase/notifications";

const formatDate = (val) => {
  if (!val) return "";
  try {
    const date = typeof val.toDate === "function" ? val.toDate() : new Date(val);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}/${m}/${d}`;
  } catch {
    return "";
  }
};

export default function NotificationsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/auth");
      return;
    }

    const load = async () => {
      setPageLoading(true);
      const data = await getNotifications(user.uid);
      setNotifications(data);
      // 進入頁面自動標記全部已讀
      await markAllNotificationsAsRead(user.uid);
      setPageLoading(false);
    };

    load();
  }, [user, loading, navigate]);

  const getMessage = (n) => {
    if (n.type === "reply") {
      return (
        <>
          <span className="font-semibold text-dark">{n.fromUserName}</span>
          {" 回覆了你在《"}
          <span className="font-semibold text-primary">{n.novelTitle || "某本小說"}</span>
          {"》的留言"}
        </>
      );
    }
    if (n.type === "like") {
      return (
        <>
          <span className="font-semibold text-dark">{n.fromUserName}</span>
          {" 對你在《"}
          <span className="font-semibold text-primary">{n.novelTitle || "某本小說"}</span>
          {"》的留言按了讚"}
        </>
      );
    }
    if (n.type === "report") {
      return (
        <>
          <span className="font-semibold text-dark">{n.fromUserName}</span>
          {" 檢舉了《"}
          <span className="font-semibold text-primary">{n.novelTitle || "某本小說"}</span>
          {"》的一則留言"}
          {n.reason && (
            <span className="text-orange-600"> — {n.reason}</span>
          )}
        </>
      );
    }
    if (n.type === "comment_deleted") {
      return (
        <>
          {"你在《"}
          <span className="font-semibold text-primary">{n.novelTitle || "某本小說"}</span>
          {"》的留言已因"}
          {n.reason && <span className="text-red-500">「{n.reason}」</span>}
          {"被管理員刪除"}
        </>
      );
    }
    if (n.type === "report_resolved") {
      return (
        <>
          {"你檢舉的《"}
          <span className="font-semibold text-primary">{n.novelTitle || "某本小說"}</span>
          {"》留言已被管理員處理"}
        </>
      );
    }
    return "有新通知";
  };

  if (loading || pageLoading) {
    return (
      <div className="min-h-screen bg-light">
        <Navbar showBackButton={true} />
        <div className="max-w-3xl mx-auto px-4 py-8">
          <p className="text-center text-gray-400">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light">
      <Navbar showBackButton={true} />

      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-dark mb-8">通知</h1>

        {notifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-4xl mb-4">🔔</p>
            <p className="text-gray-500">目前沒有任何通知</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  if (!n.novelId) return;
                  const hash = n.commentId ? `#comment-${n.commentId}` : "";
                  navigate(`/novel/${n.novelId}${hash}`);
                }}
                className={`bg-white rounded-lg shadow-sm p-4 flex items-start gap-4 cursor-pointer
                  hover:shadow-md transition-shadow border-l-4 ${
                    n.read ? "border-transparent" : "border-primary"
                  }`}
              >
                {/* 圖示 */}
                <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-base ${
                  n.type === "reply" ? "bg-blue-100 text-blue-600"
                  : n.type === "report" ? "bg-orange-100 text-orange-500"
                  : n.type === "comment_deleted" ? "bg-red-100 text-red-500"
                  : n.type === "report_resolved" ? "bg-green-100 text-green-600"
                  : "bg-pink-100 text-pink-500"
                }`}>
                  {n.type === "reply" ? "↩"
                  : n.type === "report" ? "⚑"
                  : n.type === "comment_deleted" ? "✕"
                  : n.type === "report_resolved" ? "✓"
                  : "♥"}
                </div>

                {/* 內容 */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {getMessage(n)}
                  </p>
                  {n.commentContent && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                      「{n.commentContent}」
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDate(n.createdAt)}
                  </p>
                </div>

                {/* 未讀標記 */}
                {!n.read && (
                  <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-1.5" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
