// ============================================
// 檔案名稱: CommentsSection.js
// 路徑: src/components/CommentsSection.js
// 用途: 讀者評論區（新增、顯示、刪除自己的評論）
// ============================================
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { queryDocuments, setDocument, deleteDocument } from "../firebase/firestore";

const MAX_LENGTH = 300;

function formatDate(timestamp) {
  if (!timestamp) return "";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}/${m}/${d}`;
}

export default function CommentsSection({ novelId }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const collectionPath = `comments/${novelId}/items`;

  // ========== 載入評論 ==========
  const loadComments = async () => {
    try {
      setLoading(true);
      const docs = await queryDocuments(
        collectionPath,
        [],
        "createdAt",
        null
      );
      setComments(docs);
    } catch (err) {
      console.error("載入評論失敗:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [novelId]);

  // ========== 送出評論 ==========
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    setError("");

    try {
      const commentId = `comment-${Date.now()}`;
      await setDocument(collectionPath, commentId, {
        content: content.trim(),
        authorUid: user.uid,
        authorName: user.displayName || user.email.split("@")[0],
        createdAt: new Date(),
      });
      setContent("");
      await loadComments();
    } catch (err) {
      console.error("送出評論失敗:", err);
      setError("送出失敗，請稍後再試");
    } finally {
      setSubmitting(false);
    }
  };

  // ========== 刪除評論 ==========
  const handleDelete = async (commentId) => {
    if (!window.confirm("確定要刪除這則評論嗎？")) return;
    try {
      await deleteDocument(collectionPath, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      console.error("刪除評論失敗:", err);
      alert("刪除失敗，請稍後再試");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-dark mb-6">
        讀者評論
        {comments.length > 0 && (
          <span className="ml-2 text-lg font-normal text-gray-500">
            ({comments.length})
          </span>
        )}
      </h2>

      {/* ========== 輸入區 ========== */}
      {user ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex items-start gap-3">
            {/* 頭像 */}
            <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {(user.displayName || user.email).charAt(0).toUpperCase()}
              </span>
            </div>

            <div className="flex-1">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="分享你的閱讀心得..."
                maxLength={MAX_LENGTH}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none
                         focus:outline-none focus:ring-2 focus:ring-primary/50 text-dark"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-400">
                  {content.length} / {MAX_LENGTH}
                </span>
                <div className="flex items-center gap-3">
                  {error && <span className="text-sm text-red-500">{error}</span>}
                  <button
                    type="submit"
                    disabled={submitting || !content.trim()}
                    className="px-5 py-2 bg-primary text-white rounded-lg hover:bg-primary/90
                             transition-colors font-medium text-sm
                             disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {submitting ? "送出中..." : "送出"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-8 p-4 bg-light rounded-lg text-center">
          <p className="text-gray-600 mb-2">登入後才能留下評論</p>
          <Link
            to="/auth"
            className="text-primary font-medium hover:text-primary/80 transition-colors"
          >
            前往登入
          </Link>
        </div>
      )}

      {/* ========== 評論列表 ========== */}
      {loading ? (
        <p className="text-gray-400 text-center py-6">載入中...</p>
      ) : comments.length === 0 ? (
        <p className="text-gray-400 text-center py-6">還沒有評論，來留下第一則吧</p>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              {/* 頭像 */}
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-secondary/40 flex items-center justify-center">
                <span className="text-primary font-semibold text-sm">
                  {comment.authorName?.charAt(0).toUpperCase() || "?"}
                </span>
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-dark text-sm">
                      {comment.authorName}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>

                  {/* 刪除按鈕（只有自己的評論才顯示） */}
                  {user?.uid === comment.authorUid && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                    >
                      刪除
                    </button>
                  )}
                </div>

                <p className="text-gray-700 text-sm leading-relaxed break-words">
                  {comment.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
