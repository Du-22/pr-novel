// ============================================
// 檔案名稱: AdminPage.js
// 路徑: src/pages/AdminPage.js
// 用途: 管理員後台（檢舉列表、刪除留言、關閉檢舉）
// ============================================
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../hooks/useAuth";
import { ADMIN_UID } from "../config/adminConfig";
import { getReports, updateReportStatus, REPORT_REASON_LABELS } from "../firebase/reports";
import { createNotification } from "../firebase/notifications";
import Navbar from "../components/Navbar";

function formatDate(timestamp) {
  if (!timestamp) return "";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}/${m}/${d}`;
}

const STATUS_LABELS = {
  pending: { label: "待處理", color: "bg-yellow-100 text-yellow-700" },
  resolved: { label: "已刪除", color: "bg-green-100 text-green-700" },
  dismissed: { label: "已忽略", color: "bg-gray-100 text-gray-500" },
};

export default function AdminPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [filter, setFilter] = useState("pending"); // pending | all
  const [actionLoading, setActionLoading] = useState(null); // reportId

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

  // 刪除留言（軟刪除）+ 將檢舉標為 resolved
  const handleDeleteComment = async (report) => {
    if (!window.confirm("確定要刪除這則留言嗎？")) return;
    setActionLoading(report.id);
    try {
      const itemsCol = `comments/${report.novelId}/items`;
      const commentRef = doc(db, itemsCol, report.reportedCommentId);
      const commentSnap = await getDoc(commentRef);

      // 留言存在且尚未刪除才執行軟刪除
      if (commentSnap.exists() && !commentSnap.data().deleted) {
        await updateDoc(commentRef, {
          deleted: true,
          deletedAt: serverTimestamp(),
        });
      }

      await updateReportStatus(report.id, "resolved");

      // 通知被刪留言的作者
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

      // 通知提交檢舉的人
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
      alert("操作失敗，請稍後再試");
    } finally {
      setActionLoading(null);
    }
  };

  // 忽略檢舉
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

  return (
    <div className="min-h-screen bg-light">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 標題 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-dark">管理員後台</h1>
            <p className="text-sm text-gray-500 mt-1">
              共 {reports.length} 筆檢舉，{pendingCount} 筆待處理
            </p>
          </div>
          <button
            onClick={loadReports}
            className="px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg
                       hover:bg-gray-50 transition-colors text-gray-600"
          >
            重新整理
          </button>
        </div>

        {/* 篩選 */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter("pending")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === "pending"
                ? "bg-primary text-white"
                : "bg-white text-gray-500 hover:text-primary border border-gray-200"
            }`}
          >
            待處理
            {pendingCount > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === "all"
                ? "bg-primary text-white"
                : "bg-white text-gray-500 hover:text-primary border border-gray-200"
            }`}
          >
            全部
          </button>
        </div>

        {/* 列表 */}
        {fetching ? (
          <p className="text-center text-gray-400 py-12">載入中...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <p className="text-gray-400">
              {filter === "pending" ? "目前沒有待處理的檢舉" : "還沒有任何檢舉"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((report) => {
              const isLoading = actionLoading === report.id;
              const statusInfo = STATUS_LABELS[report.status] || STATUS_LABELS.pending;
              return (
                <div key={report.id} className="bg-white rounded-xl shadow-sm p-5">
                  {/* 頂部：狀態 + 時間 */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                    <span className="text-xs text-gray-400">{formatDate(report.createdAt)}</span>
                  </div>

                  {/* 被檢舉的留言 */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <p className="text-xs text-gray-400 mb-1">被檢舉的留言</p>
                    <p className="text-sm text-dark break-words">
                      {report.reportedContent || "（留言內容不存在）"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      作者：{report.reportedAuthorName}
                    </p>
                  </div>

                  {/* 檢舉資訊 */}
                  <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                    <div>
                      <span className="text-gray-400">檢舉人：</span>
                      <span className="text-dark">{report.reporterName}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">原因：</span>
                      <span className="text-dark">
                        {REPORT_REASON_LABELS[report.reason] || report.reason}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-400">小說：</span>
                      <Link
                        to={`/novel/${report.novelId}`}
                        className="text-primary hover:text-primary/80 transition-colors"
                      >
                        《{report.novelTitle || report.novelId}》
                      </Link>
                    </div>
                    {report.detail && (
                      <div className="col-span-2">
                        <span className="text-gray-400">詳細說明：</span>
                        <span className="text-dark break-words">{report.detail}</span>
                      </div>
                    )}
                  </div>

                  {/* 操作按鈕 */}
                  {report.status === "pending" && (
                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => handleDeleteComment(report)}
                        disabled={isLoading}
                        className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-medium
                                   hover:bg-red-600 transition-colors disabled:opacity-50"
                      >
                        {isLoading ? "處理中..." : "刪除留言並結案"}
                      </button>
                      <button
                        onClick={() => handleDismiss(report.id)}
                        disabled={isLoading}
                        className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium
                                   hover:bg-gray-200 transition-colors disabled:opacity-50"
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
      </div>
    </div>
  );
}
