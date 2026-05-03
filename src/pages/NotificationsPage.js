// ============================================
// 檔案名稱: NotificationsPage.js
// 路徑: src/pages/NotificationsPage.js
// 用途: 通知列表頁(回覆、按讚、檢舉、刪除、處理)
// ============================================

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Reply, Heart, Flag, X, Check } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
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

// 通知類型 → icon + 顏色 mapping (跟 CommentsSection dropdown 一致)
const getNotifIconConfig = (type) => {
  switch (type) {
    case "reply":
      return { Icon: Reply, bg: "bg-info-light", text: "text-info" };
    case "report":
      return { Icon: Flag, bg: "bg-warning-light", text: "text-warning" };
    case "comment_deleted":
      return { Icon: X, bg: "bg-danger-light", text: "text-danger" };
    case "report_resolved":
      return { Icon: Check, bg: "bg-success-light", text: "text-success" };
    default:
      return { Icon: Heart, bg: "bg-warm-50", text: "text-warm" };
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
    const novelLink = (
      <span className="font-semibold text-primary dark:text-primary-light">
        {n.novelTitle || "某本小說"}
      </span>
    );
    const userLink = (
      <span className="font-semibold text-neutral-900 dark:text-neutral-100">
        {n.fromUserName}
      </span>
    );

    if (n.type === "reply") {
      return <>{userLink} 回覆了你在《{novelLink}》的留言</>;
    }
    if (n.type === "like") {
      return <>{userLink} 對你在《{novelLink}》的留言按了讚</>;
    }
    if (n.type === "report") {
      return (
        <>
          {userLink} 檢舉了《{novelLink}》的一則留言
          {n.reason && <span className="text-warning"> — {n.reason}</span>}
        </>
      );
    }
    if (n.type === "comment_deleted") {
      return (
        <>
          你在《{novelLink}》的留言已因
          {n.reason && <span className="text-danger">「{n.reason}」</span>}
          被管理員刪除
        </>
      );
    }
    if (n.type === "report_resolved") {
      return <>你檢舉的《{novelLink}》留言已被管理員處理</>;
    }
    return "有新通知";
  };

  if (loading || pageLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
        <Navbar showBackButton={true} />
        <div className="max-w-3xl mx-auto px-4 py-8">
          <p className="text-center text-neutral-400 dark:text-neutral-500">
            載入中...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950">
      <Navbar showBackButton={true} />

      <main className="flex-1 container mx-auto px-4 py-8 md:py-12 max-w-3xl">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-8
                       text-neutral-900 dark:text-neutral-100">
          通知
        </h1>

        {notifications.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border
                          bg-white border-neutral-200
                          dark:bg-neutral-900 dark:border-neutral-800">
            <Bell className="w-12 h-12 mx-auto mb-3 text-neutral-300 dark:text-neutral-700" />
            <p className="text-neutral-500 dark:text-neutral-400">
              目前沒有任何通知
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => {
              const { Icon, bg, text } = getNotifIconConfig(n.type);
              return (
                <div
                  key={n.id}
                  onClick={() => {
                    if (!n.novelId) return;
                    const hash = n.commentId ? `#comment-${n.commentId}` : "";
                    navigate(`/novel/${n.novelId}${hash}`);
                  }}
                  className={`p-4 flex items-start gap-4 cursor-pointer rounded-xl border transition-all
                              hover:border-neutral-300 dark:hover:border-neutral-700
                              ${
                                n.read
                                  ? "bg-white border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800"
                                  : "bg-primary-50 border-primary/20 dark:bg-primary/10 dark:border-primary/30"
                              }`}
                >
                  {/* Icon */}
                  <div
                    className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${bg} ${text}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  {/* 內容 */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                      {getMessage(n)}
                    </p>
                    {n.commentContent && (
                      <p className="mt-1 text-xs line-clamp-1 text-neutral-400 dark:text-neutral-500">
                        「{n.commentContent}」
                      </p>
                    )}
                    <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
                      {formatDate(n.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
