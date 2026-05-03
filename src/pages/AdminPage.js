// ============================================
// 檔案名稱: AdminPage.js
// 路徑: src/pages/AdminPage.js
// 用途: 管理員後台 — 檢舉列表 + 刪除留言 + 忽略檢舉
// ============================================

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../hooks/useAuth";
import { ADMIN_UID } from "../config/adminConfig";
import { getReports, updateReportStatus, REPORT_REASON_LABELS } from "../firebase/reports";
import { createNotification } from "../firebase/notifications";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function formatDate(timestamp) {
  if (!timestamp) return "";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}/${m}/${d}`;
}

const STATUS_LABELS = {
  pending: {
    label: "待處理",
    color: "bg-warning-light text-warning",
  },
  resolved: {
    label: "已刪除",
    color: "bg-success-light text-success",
  },
  dismissed: {
    label: "已忽略",
    color: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
  },
};

export default function AdminPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    if (loading) return;
    if (!user || user.uid !== ADMIN_UID) {
      navigate("/");
      return;
    }
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);

  const loadReports = async () => {
    setFetching(true);
    try {
      const data = await getReports();
      setReports(data);
    } catch (err) {
      console.error("載入檢舉失敗:", err);
    } finally {
      setFetching(false);
    }
  };

  const handleDeleteComment = async (report) => {
    if (!window.confirm("確定要刪除這則留言嗎?")) return;
    setActionLoading(report.id);
    try {
      const itemsCol = `comments/${report.novelId}/items`;
      const commentRef = doc(db, itemsCol, report.reportedCommentId);
      const commentSnap = await getDoc(commentRef);

      if (commentSnap.exists() && !commentSnap.data().deleted) {
        await updateDoc(commentRef, {
          deleted: true,
          deletedAt: serverTimestamp(),
        });
      }

      await updateReportStatus(report.id, "resolved");

      if (report.reportedAuthorUid) {
        createNotification(report.reportedAuthorUid, {
          type: "comment_deleted",
          novelId: report.novelId,
          novelTitle: report.novelTitle || "",
          commentContent: report.reportedContent?.slice(0, 50) || "",
          reason: REPORT_REASON_LABELS[report.reason] || report.reason,
          commentId: report.reportedCommentId,
          chapterNumber: report.chapterNumber ?? null,
        }).catch(() => {});
      }

      if (report.reporterUid) {
        createNotification(report.reporterUid, {
          type: "report_resolved",
          novelId: report.novelId,
          novelTitle: report.novelTitle || "",
          commentContent: report.reportedContent?.slice(0, 50) || "",
          commentId: report.reportedCommentId,
          chapterNumber: report.chapterNumber ?? null,
        }).catch(() => {});
      }

      setReports((prev) =>
        prev.map((r) => (r.id === report.id ? { ...r, status: "resolved" } : r))
      );
    } catch (err) {
      console.error("刪除留言失敗:", err);
      alert("操作失敗,請稍後再試");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDismiss = async (reportId) => {
    setActionLoading(reportId);
    try {
      await updateReportStatus(reportId, "dismissed");
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: "dismissed" } : r))
      );
    } catch (err) {
      console.error("忽略檢舉失敗:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = filter === "pending"
    ? reports.filter((r) => r.status === "pending")
    : reports;

  const pendingCount = reports.filter((r) => r.status === "pending").length;

  if (loading) return null;
  if (!user || user.uid !== ADMIN_UID) return null;

  // 篩選 pill 共用樣式
  const filterBtnClass = (key) =>
    `inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
      filter === key
        ? "bg-primary text-white shadow-sm"
        : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 hover:text-neutral-900 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-neutral-100"
    }`;

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8 md:py-12 max-w-4xl">
        {/* 標題 */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              管理員後台
            </h1>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              共 {reports.length} 筆檢舉,{pendingCount} 筆待處理
            </p>
          </div>
          <button
            onClick={loadReports}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg border transition-colors
                       text-neutral-700 border-neutral-200 hover:bg-neutral-100
                       dark:text-neutral-300 dark:border-neutral-800 dark:hover:bg-neutral-800"
          >
            <RefreshCw className="w-4 h-4" />
            重新整理
          </button>
        </div>

        {/* 篩選 */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setFilter("pending")} className={filterBtnClass("pending")}>
            待處理
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-danger text-white">
                {pendingCount}
              </span>
            )}
          </button>
          <button onClick={() => setFilter("all")} className={filterBtnClass("all")}>
            全部
          </button>
        </div>

        {/* 列表 */}
        {fetching ? (
          <p className="text-center py-12 text-neutral-400 dark:text-neutral-500">
            載入中...
          </p>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center rounded-2xl border
                          bg-white border-neutral-200
                          dark:bg-neutral-900 dark:border-neutral-800">
            <p className="text-neutral-400 dark:text-neutral-500">
              {filter === "pending" ? "目前沒有待處理的檢舉" : "還沒有任何檢舉"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((report) => {
              const isLoading = actionLoading === report.id;
              const statusInfo = STATUS_LABELS[report.status] || STATUS_LABELS.pending;
              return (
                <div
                  key={report.id}
                  className="p-5 rounded-2xl border
                             bg-white border-neutral-200
                             dark:bg-neutral-900 dark:border-neutral-800"
                >
                  {/* 頂部:狀態 + 時間 */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                    <span className="text-xs text-neutral-400 dark:text-neutral-500">
                      {formatDate(report.createdAt)}
                    </span>
                  </div>

                  {/* 被檢舉的留言 */}
                  <div className="mb-3 p-3 rounded-lg
                                  bg-neutral-100 dark:bg-neutral-800">
                    <p className="mb-1 text-xs text-neutral-400 dark:text-neutral-500">
                      被檢舉的留言
                    </p>
                    <p className="text-sm break-words text-neutral-900 dark:text-neutral-100">
                      {report.reportedContent || "(留言內容不存在)"}
                    </p>
                    <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
                      作者:{report.reportedAuthorName}
                    </p>
                  </div>

                  {/* 檢舉資訊 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 text-xs">
                    <div>
                      <span className="text-neutral-400 dark:text-neutral-500">檢舉人:</span>{" "}
                      <span className="text-neutral-900 dark:text-neutral-100">
                        {report.reporterName}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-400 dark:text-neutral-500">原因:</span>{" "}
                      <span className="text-neutral-900 dark:text-neutral-100">
                        {REPORT_REASON_LABELS[report.reason] || report.reason}
                      </span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-neutral-400 dark:text-neutral-500">小說:</span>{" "}
                      <Link
                        to={`/novel/${report.novelId}`}
                        className="transition-colors
                                   text-primary hover:text-primary-dark
                                   dark:text-primary-light dark:hover:text-primary"
                      >
                        《{report.novelTitle || report.novelId}》
                      </Link>
                    </div>
                    {report.detail && (
                      <div className="sm:col-span-2">
                        <span className="text-neutral-400 dark:text-neutral-500">詳細說明:</span>{" "}
                        <span className="break-words text-neutral-900 dark:text-neutral-100">
                          {report.detail}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 操作按鈕 */}
                  {report.status === "pending" && (
                    <div className="flex gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                      <button
                        onClick={() => handleDeleteComment(report)}
                        disabled={isLoading}
                        className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors
                                   bg-danger text-white hover:opacity-90
                                   disabled:opacity-50"
                      >
                        {isLoading ? "處理中..." : "刪除留言並結案"}
                      </button>
                      <button
                        onClick={() => handleDismiss(report.id)}
                        disabled={isLoading}
                        className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors
                                   bg-neutral-100 text-neutral-700 hover:bg-neutral-200
                                   dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700
                                   disabled:opacity-50"
                      >
                        忽略結案
                      </button>
                    </div>
                  )}
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
