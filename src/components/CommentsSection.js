// ============================================
// 檔案名稱: CommentsSection.js
// 路徑: src/components/CommentsSection.js
// 用途: 讀者評論區(樓層編號、巢狀回覆、@mention、按讚、刪除、檢舉)
// ============================================

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { Heart } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  runTransaction,
  arrayUnion,
  arrayRemove,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { createNotification } from "../firebase/notifications";
import { submitReport } from "../firebase/reports";
import { ADMIN_UID } from "../config/adminConfig";

const MAX_LENGTH = 300;

function formatDate(timestamp) {
  if (!timestamp) return "";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}/${m}/${d}`;
}

function Avatar({
  name,
  uid,
  size = "w-9 h-9",
  bg = "bg-primary/10 dark:bg-primary/20",
  textColor = "text-primary dark:text-primary-light",
}) {
  const inner = (
    <div
      className={`flex-shrink-0 ${size} rounded-full ${bg} flex items-center justify-center`}
    >
      <span className={`${textColor} font-semibold text-sm`}>
        {name?.charAt(0).toUpperCase() || "?"}
      </span>
    </div>
  );
  if (uid) {
    return (
      <Link to={`/user/${uid}`} onClick={(e) => e.stopPropagation()}>
        {inner}
      </Link>
    );
  }
  return inner;
}

function FloorBadge({ floor }) {
  return (
    <span className="text-xs font-mono px-1.5 py-0.5 rounded mr-1
                     text-primary bg-primary/10
                     dark:text-primary-light dark:bg-primary/20">
      B{floor}
    </span>
  );
}

// 共用 className helpers
const ACTION_BTN =
  "text-xs transition-colors text-neutral-400 hover:text-primary dark:text-neutral-500 dark:hover:text-primary-light";
const ACTION_BTN_DANGER =
  "text-xs transition-colors text-neutral-400 hover:text-danger dark:text-neutral-500";
const ACTION_BTN_WARNING =
  "text-xs transition-colors text-neutral-400 hover:text-warning dark:text-neutral-500";

const TOP_LEVEL_LIMIT = 10;
const REPLY_LIMIT = 2;

export default function CommentsSection({
  novelId,
  novelTitle = "",
  chapterNumber = null,
  volumeNumber = null, // 分卷小說傳卷號;不傳代表單卷或詳情頁
  chapters = [],
}) {
  const { user } = useAuth();
  const location = useLocation();
  const [topLevelComments, setTopLevelComments] = useState([]);
  const [replyMap, setReplyMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [userNameMap, setUserNameMap] = useState({});

  const [showAllTopLevel, setShowAllTopLevel] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState({});
  const [showDeletedIds, setShowDeletedIds] = useState(new Set());

  const toggleShowDeleted = (id) => {
    setShowDeletedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);
  const replyTextareaRef = useRef(null);

  const [sortBy, setSortBy] = useState("likes");

  const [reportingComment, setReportingComment] = useState(null);
  const [reportReason, setReportReason] = useState("spam");
  const [reportDetail, setReportDetail] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  const chapterTitleMap = useMemo(() => {
    const map = {};
    chapters.forEach((c) => {
      const label = c.isSpecial
        ? c.label || `第${c.chapterNumber}章`
        : `第${c.chapterNumber}章`;
      const title = c.title && c.title !== label ? ` - ${c.title}` : "";
      map[c.chapterNumber] = `${label}${title}`;
    });
    return map;
  }, [chapters]);

  const counterDocRef = doc(db, "comments", novelId);
  const itemsCol = `comments/${novelId}/items`;

  // ========== 載入評論 ==========
  const loadComments = useCallback(async () => {
    try {
      setLoading(true);
      const q = query(collection(db, itemsCol), orderBy("createdAt", "asc"));
      const snapshot = await getDocs(q);
      const all = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

      const topLevel = all.filter((c) => {
        if (c.parentId) return false;
        if (chapterNumber === null) return true;
        if (c.chapterNumber !== chapterNumber) return false;
        // 分卷:同卷的留言才算這頁的;單卷不檢查 volumeNumber
        if (volumeNumber !== null) {
          return (c.volumeNumber ?? null) === volumeNumber;
        }
        return true;
      });
      const topLevelIds = new Set(topLevel.map((c) => c.id));
      const replies = all.filter(
        (c) => c.parentId && topLevelIds.has(c.parentId),
      );

      const map = {};
      replies.forEach((r) => {
        if (!map[r.parentId]) map[r.parentId] = [];
        map[r.parentId].push(r);
      });

      setTopLevelComments(topLevel);
      setReplyMap(map);

      const uids = [...new Set(all.filter((c) => c.authorUid).map((c) => c.authorUid))];
      if (uids.length > 0) {
        const snaps = await Promise.all(uids.map((uid) => getDoc(doc(db, "users", uid))));
        const nameMap = {};
        snaps.forEach((snap) => {
          if (snap.exists()) nameMap[snap.id] = snap.data().displayName;
        });
        setUserNameMap(nameMap);
      }
    } catch (err) {
      console.error("載入評論失敗:", err);
    } finally {
      setLoading(false);
    }
  }, [chapterNumber, volumeNumber, itemsCol]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  // ========== URL hash 跳轉到指定留言 ==========
  useEffect(() => {
    if (loading || !location.hash?.startsWith("#comment-")) return;
    const targetId = location.hash.replace("#comment-", "");

    const isTopLevel = topLevelComments.some((c) => c.id === targetId);
    if (isTopLevel) {
      setShowAllTopLevel(true);
    } else {
      for (const [parentId, replies] of Object.entries(replyMap)) {
        if (replies.some((r) => r.id === targetId)) {
          setExpandedReplies((prev) => ({ ...prev, [parentId]: true }));
          break;
        }
      }
    }

    setTimeout(() => {
      const el = document.getElementById(`comment-${targetId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-2", "ring-primary", "ring-offset-2", "rounded-lg");
        setTimeout(() => {
          el.classList.remove("ring-2", "ring-primary", "ring-offset-2", "rounded-lg");
        }, 2500);
      }
    }, 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, location.hash]);

  // ========== 送出第一層留言 ==========
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || submitting) return;

    setSubmitting(true);
    setError("");

    try {
      const floorNumber = await runTransaction(db, async (transaction) => {
        const counterSnap = await transaction.get(counterDocRef);
        const current = counterSnap.exists()
          ? counterSnap.data().topLevelCount || 0
          : 0;
        const next = current + 1;
        transaction.set(
          counterDocRef,
          { topLevelCount: next },
          { merge: true },
        );
        return next;
      });

      const commentId = `comment-${Date.now()}`;
      await setDoc(doc(db, itemsCol, commentId), {
        content: content.trim(),
        authorUid: user.uid,
        authorName: user.displayName || user.email.split("@")[0],
        floorNumber,
        parentId: null,
        replyCount: 0,
        chapterNumber: chapterNumber ?? null,
        volumeNumber: volumeNumber ?? null,
        createdAt: new Date(),
      });

      setContent("");
      await loadComments();
    } catch (err) {
      console.error("送出評論失敗:", err);
      setError("送出失敗,請稍後再試");
    } finally {
      setSubmitting(false);
    }
  };

  // ========== 點擊回覆按鈕 ==========
  const handleReplyClick = (comment) => {
    let firstLevel;
    let mentionFloor;

    if (!comment.parentId) {
      firstLevel = comment;
      mentionFloor = comment.floorNumber;
    } else {
      firstLevel = topLevelComments.find((c) => c.id === comment.parentId);
      mentionFloor = comment.floorNumber;
    }

    if (!firstLevel) return;
    setReplyingTo(firstLevel);
    const prefix = `@B${mentionFloor} `;
    setReplyContent(prefix);
    setTimeout(() => {
      const el = replyTextareaRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(prefix.length, prefix.length);
    }, 50);
  };

  // ========== 送出回覆 ==========
  const handleSubmitReply = async () => {
    if (!replyContent.trim() || replySubmitting || !replyingTo) return;

    setReplySubmitting(true);

    try {
      const parentDocRef = doc(db, itemsCol, replyingTo.id);

      const replyIndex = await runTransaction(db, async (transaction) => {
        const parentSnap = await transaction.get(parentDocRef);
        const current = parentSnap.exists()
          ? parentSnap.data().replyCount || 0
          : 0;
        const next = current + 1;
        transaction.update(parentDocRef, { replyCount: next });
        return next;
      });

      const parentFloor = replyingTo.floorNumber;
      const replyFloor = `${parentFloor}-${replyIndex}`;

      const replyId = `reply-${Date.now()}`;
      await setDoc(doc(db, itemsCol, replyId), {
        content: replyContent.trim(),
        authorUid: user.uid,
        authorName: user.displayName || user.email.split("@")[0],
        floorNumber: replyFloor,
        parentId: replyingTo.id,
        parentFloor,
        chapterNumber: chapterNumber ?? null,
        volumeNumber: volumeNumber ?? null,
        createdAt: new Date(),
      });

      if (replyingTo.authorUid && replyingTo.authorUid !== user.uid) {
        createNotification(replyingTo.authorUid, {
          type: "reply",
          fromUserName: user.displayName || user.email.split("@")[0],
          novelId,
          novelTitle,
          commentContent: replyContent.trim().slice(0, 50),
          chapterNumber: chapterNumber ?? null,
        }).catch(() => {});
      }

      setReplyingTo(null);
      setReplyContent("");
      await loadComments();
    } catch (err) {
      console.error("送出回覆失敗:", err);
    } finally {
      setReplySubmitting(false);
    }
  };

  // ========== 刪除留言(軟刪除) ==========
  const handleDelete = async (commentId) => {
    if (!window.confirm("確定要刪除這則留言嗎?")) return;
    try {
      await updateDoc(doc(db, itemsCol, commentId), {
        deleted: true,
        deletedAt: serverTimestamp(),
      });
      await loadComments();
    } catch (err) {
      console.error("刪除留言失敗:", err);
      alert("刪除失敗,請稍後再試");
    }
  };

  // ========== 按讚 ==========
  const handleLike = async (comment) => {
    if (!user) return;

    const isReply = !!comment.parentId;
    const likedBy = comment.likedBy || [];
    const alreadyLiked = likedBy.includes(user.uid);

    const updateLocal = (list) =>
      list.map((c) => {
        if (c.id !== comment.id) return c;
        const newLikedBy = alreadyLiked
          ? likedBy.filter((uid) => uid !== user.uid)
          : [...likedBy, user.uid];
        return { ...c, likedBy: newLikedBy, likes: newLikedBy.length };
      });

    if (isReply) {
      setReplyMap((prev) => {
        const updated = { ...prev };
        if (updated[comment.parentId]) {
          updated[comment.parentId] = updateLocal(updated[comment.parentId]);
        }
        return updated;
      });
    } else {
      setTopLevelComments((prev) => updateLocal(prev));
    }

    try {
      const ref = doc(db, itemsCol, comment.id);
      await updateDoc(ref, {
        likedBy: alreadyLiked ? arrayRemove(user.uid) : arrayUnion(user.uid),
      });

      if (!alreadyLiked && comment.authorUid && comment.authorUid !== user.uid) {
        createNotification(comment.authorUid, {
          type: "like",
          fromUserName: user.displayName || user.email.split("@")[0],
          novelId,
          novelTitle,
          commentContent: comment.content?.slice(0, 50) || "",
          chapterNumber: comment.chapterNumber ?? null,
        }).catch(() => {});
      }
    } catch (err) {
      console.error("按讚失敗:", err);
      await loadComments();
    }
  };

  // ========== 開啟/送出檢舉 ==========
  const openReport = (comment) => {
    setReportingComment(comment);
    setReportReason("spam");
    setReportDetail("");
    setReportSuccess(false);
  };

  const handleReport = async () => {
    if (!reportingComment || reportSubmitting) return;
    setReportSubmitting(true);
    try {
      await submitReport({
        reportedCommentId: reportingComment.id,
        reportedContent: reportingComment.content,
        reportedAuthorName: reportingComment.authorName,
        reportedAuthorUid: reportingComment.authorUid,
        reporterUid: user.uid,
        reporterName: user.displayName || user.email.split("@")[0],
        novelId,
        novelTitle,
        chapterNumber: reportingComment.chapterNumber,
        reason: reportReason,
        detail: reportDetail,
      });
      setReportSuccess(true);
      setTimeout(() => {
        setReportingComment(null);
        setReportSuccess(false);
      }, 2000);
    } catch (err) {
      console.error("檢舉失敗:", err);
    } finally {
      setReportSubmitting(false);
    }
  };

  // ========== 排序 ==========
  const sortedTopLevel = useMemo(() => {
    const toDate = (ts) => (ts?.toDate ? ts.toDate() : new Date(ts));
    if (sortBy === "likes") {
      return [...topLevelComments].sort(
        (a, b) => (b.likedBy?.length || 0) - (a.likedBy?.length || 0),
      );
    }
    if (sortBy === "oldest") {
      return [...topLevelComments].sort((a, b) => toDate(a.createdAt) - toDate(b.createdAt));
    }
    return [...topLevelComments].sort((a, b) => toDate(b.createdAt) - toDate(a.createdAt));
  }, [topLevelComments, sortBy]);

  const totalCount =
    topLevelComments.length +
    Object.values(replyMap).reduce((sum, arr) => sum + arr.length, 0);

  const getDisplayName = (comment) => userNameMap[comment.authorUid] || comment.authorName;

  // 排序按鈕共用樣式
  const sortBtnClass = (key) =>
    `px-3 py-1 rounded-full transition-colors ${
      sortBy === key
        ? "bg-primary text-white"
        : "text-neutral-500 hover:text-primary dark:text-neutral-400 dark:hover:text-primary-light"
    }`;

  return (
    <div className="rounded-2xl border p-5 sm:p-6
                    bg-white border-neutral-200
                    dark:bg-neutral-900 dark:border-neutral-800">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight
                       text-neutral-900 dark:text-neutral-100">
          讀者留言
          {totalCount > 0 && (
            <span className="ml-2 text-base sm:text-lg font-normal text-neutral-500 dark:text-neutral-400">
              ({totalCount})
            </span>
          )}
        </h2>
        {topLevelComments.length > 0 && (
          <div className="flex items-center gap-1 text-sm">
            <button onClick={() => setSortBy("likes")} className={sortBtnClass("likes")}>
              熱門
            </button>
            <button onClick={() => setSortBy("oldest")} className={sortBtnClass("oldest")}>
              按時間
            </button>
            <button onClick={() => setSortBy("time")} className={sortBtnClass("time")}>
              最新
            </button>
          </div>
        )}
      </div>

      {/* ========== 第一層留言輸入區 ========== */}
      {user ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex items-start gap-3">
            <Avatar
              name={user.displayName || user.email}
              bg="bg-primary"
              textColor="text-white"
            />
            <div className="flex-1">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="分享你的閱讀心得..."
                maxLength={MAX_LENGTH}
                rows={3}
                className="w-full px-4 py-3 rounded-lg resize-none border
                           bg-white text-neutral-900 placeholder-neutral-400 border-neutral-300
                           focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
                           dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500 dark:border-neutral-700"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-neutral-400 dark:text-neutral-500">
                  {content.length} / {MAX_LENGTH}
                </span>
                <div className="flex items-center gap-3">
                  {error && (
                    <span className="text-sm text-danger">{error}</span>
                  )}
                  <button
                    type="submit"
                    disabled={submitting || !content.trim()}
                    className="px-5 py-2 rounded-lg font-medium text-sm transition-colors
                               bg-primary text-white hover:bg-primary-dark
                               disabled:bg-neutral-300 disabled:text-neutral-500 disabled:cursor-not-allowed
                               dark:disabled:bg-neutral-700 dark:disabled:text-neutral-500"
                  >
                    {submitting ? "送出中..." : "送出"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-8 p-4 rounded-lg text-center
                        bg-neutral-100 dark:bg-neutral-800">
          <p className="mb-2 text-neutral-600 dark:text-neutral-400">
            登入後才能留下留言
          </p>
          <Link
            to="/auth"
            className="font-medium transition-colors
                       text-primary hover:text-primary-dark
                       dark:text-primary-light dark:hover:text-primary"
          >
            前往登入
          </Link>
        </div>
      )}

      {/* ========== 留言列表 ========== */}
      {loading ? (
        <p className="text-center py-6 text-neutral-400 dark:text-neutral-500">
          載入中...
        </p>
      ) : topLevelComments.length === 0 ? (
        <p className="text-center py-6 text-neutral-400 dark:text-neutral-500">
          還沒有留言,來留下第一則吧
        </p>
      ) : (
        <div className="space-y-6">
          {(showAllTopLevel
            ? sortedTopLevel
            : sortedTopLevel.slice(0, TOP_LEVEL_LIMIT)
          ).map((comment) => {
            const replies = replyMap[comment.id] || [];
            const isReplyingHere = replyingTo?.id === comment.id;
            const isRepliesExpanded = expandedReplies[comment.id];
            const visibleReplies = isRepliesExpanded
              ? replies
              : replies.slice(0, REPLY_LIMIT);
            const hiddenReplyCount = replies.length - REPLY_LIMIT;

            return (
              <div key={comment.id} id={`comment-${comment.id}`}>
                {/* ---- 第一層留言 ---- */}
                <div className="flex gap-3">
                  <Avatar name={getDisplayName(comment)} uid={comment.deleted ? undefined : comment.authorUid} />
                  <div className="flex-1">
                    {comment.deleted ? (
                      <div>
                        {showDeletedIds.has(comment.id) ? (
                          <div className="opacity-70">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs px-1.5 py-0.5 rounded bg-danger-light text-danger">
                                已刪除
                              </span>
                              <button
                                onClick={() => toggleShowDeleted(comment.id)}
                                className="text-xs transition-colors text-neutral-400 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-300"
                              >
                                隱藏
                              </button>
                            </div>
                            <p className="text-sm leading-relaxed break-words line-through text-neutral-500 dark:text-neutral-500">
                              {comment.content}
                            </p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <p className="text-sm italic text-neutral-400 dark:text-neutral-500">
                              此留言已被刪除
                            </p>
                            <button
                              onClick={() => toggleShowDeleted(comment.id)}
                              className={ACTION_BTN}
                            >
                              顯示
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-1 gap-2">
                          <div className="flex items-center gap-2 flex-wrap min-w-0">
                            <FloorBadge floor={comment.floorNumber} />
                            <span className="font-medium text-sm text-neutral-900 dark:text-neutral-100">
                              {getDisplayName(comment)}
                            </span>
                            {chapterNumber === null && (
                              <span
                                className={`text-xs px-1.5 py-0.5 rounded ${
                                  comment.chapterNumber
                                    ? "text-primary bg-primary/10 dark:text-primary-light dark:bg-primary/20"
                                    : "text-neutral-500 bg-neutral-100 dark:text-neutral-400 dark:bg-neutral-800"
                                }`}
                              >
                                {comment.chapterNumber
                                  ? `於 ${chapterTitleMap[comment.chapterNumber] || `第${comment.chapterNumber}章`} 留言`
                                  : "於 目錄頁 留言"}
                              </span>
                            )}
                            <span className="text-xs text-neutral-400 dark:text-neutral-500">
                              {formatDate(comment.createdAt)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            {/* 按讚 */}
                            <button
                              onClick={() => handleLike(comment)}
                              className={`flex items-center gap-1 text-xs transition-colors ${
                                user && comment.likedBy?.includes(user.uid)
                                  ? "text-primary font-medium dark:text-primary-light"
                                  : "text-neutral-400 hover:text-primary dark:text-neutral-500 dark:hover:text-primary-light"
                              }`}
                            >
                              <Heart
                                className="w-3.5 h-3.5"
                                fill={user && comment.likedBy?.includes(user.uid) ? "currentColor" : "none"}
                              />
                              {comment.likedBy?.length > 0 && (
                                <span>{comment.likedBy.length}</span>
                              )}
                            </button>
                            {user && (
                              <button onClick={() => handleReplyClick(comment)} className={ACTION_BTN}>
                                回覆
                              </button>
                            )}
                            {(user?.uid === comment.authorUid || user?.uid === ADMIN_UID) && (
                              <button onClick={() => handleDelete(comment.id)} className={`${ACTION_BTN_DANGER} dark:hover:text-danger`}>
                                刪除
                              </button>
                            )}
                            {user && user.uid !== comment.authorUid && (
                              <button onClick={() => openReport(comment)} className={`${ACTION_BTN_WARNING} dark:hover:text-warning`}>
                                檢舉
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-sm leading-relaxed break-words text-neutral-700 dark:text-neutral-300">
                          {comment.content}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* ---- 回覆列表 ---- */}
                {replies.length > 0 && (
                  <div className="ml-12 mt-3 space-y-3 pl-4 border-l-2 border-neutral-100 dark:border-neutral-800">
                    {visibleReplies.map((reply) => (
                      <div key={reply.id} id={`comment-${reply.id}`} className="flex gap-3">
                        <Avatar name={getDisplayName(reply)} uid={reply.deleted ? undefined : reply.authorUid} size="w-7 h-7" />
                        <div className="flex-1">
                          {reply.deleted ? (
                            <div>
                              {showDeletedIds.has(reply.id) ? (
                                <div className="opacity-70">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs px-1.5 py-0.5 rounded bg-danger-light text-danger">
                                      已刪除
                                    </span>
                                    <button
                                      onClick={() => toggleShowDeleted(reply.id)}
                                      className="text-xs transition-colors text-neutral-400 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-300"
                                    >
                                      隱藏
                                    </button>
                                  </div>
                                  <p className="text-sm leading-relaxed break-words line-through text-neutral-500 dark:text-neutral-500">
                                    {reply.content}
                                  </p>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <p className="text-sm italic text-neutral-400 dark:text-neutral-500">
                                    此留言已被刪除
                                  </p>
                                  <button
                                    onClick={() => toggleShowDeleted(reply.id)}
                                    className={ACTION_BTN}
                                  >
                                    顯示
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center justify-between mb-1 gap-2">
                                <div className="flex items-center gap-2 flex-wrap min-w-0">
                                  <FloorBadge floor={reply.floorNumber} />
                                  <span className="font-medium text-sm text-neutral-900 dark:text-neutral-100">
                                    {getDisplayName(reply)}
                                  </span>
                                  <span className="text-xs text-neutral-400 dark:text-neutral-500">
                                    {formatDate(reply.createdAt)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 flex-shrink-0">
                                  {/* 按讚 */}
                                  <button
                                    onClick={() => handleLike(reply)}
                                    className={`flex items-center gap-1 text-xs transition-colors ${
                                      user && reply.likedBy?.includes(user.uid)
                                        ? "text-primary font-medium dark:text-primary-light"
                                        : "text-neutral-400 hover:text-primary dark:text-neutral-500 dark:hover:text-primary-light"
                                    }`}
                                  >
                                    <Heart
                                      className="w-3.5 h-3.5"
                                      fill={user && reply.likedBy?.includes(user.uid) ? "currentColor" : "none"}
                                    />
                                    {reply.likedBy?.length > 0 && (
                                      <span>{reply.likedBy.length}</span>
                                    )}
                                  </button>
                                  {user && (
                                    <button onClick={() => handleReplyClick(reply)} className={ACTION_BTN}>
                                      回覆
                                    </button>
                                  )}
                                  {(user?.uid === reply.authorUid || user?.uid === ADMIN_UID) && (
                                    <button onClick={() => handleDelete(reply.id)} className={`${ACTION_BTN_DANGER} dark:hover:text-danger`}>
                                      刪除
                                    </button>
                                  )}
                                  {user && user.uid !== reply.authorUid && (
                                    <button onClick={() => openReport(reply)} className={`${ACTION_BTN_WARNING} dark:hover:text-warning`}>
                                      檢舉
                                    </button>
                                  )}
                                </div>
                              </div>
                              <p className="text-sm leading-relaxed break-words text-neutral-700 dark:text-neutral-300">
                                {reply.content}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                    {/* 展開更多回覆 */}
                    {!isRepliesExpanded && hiddenReplyCount > 0 && (
                      <button
                        onClick={() =>
                          setExpandedReplies((prev) => ({ ...prev, [comment.id]: true }))
                        }
                        className={ACTION_BTN}
                      >
                        展開 {hiddenReplyCount} 則回覆
                      </button>
                    )}
                    {isRepliesExpanded && replies.length > REPLY_LIMIT && (
                      <button
                        onClick={() =>
                          setExpandedReplies((prev) => ({ ...prev, [comment.id]: false }))
                        }
                        className="text-xs transition-colors text-neutral-400 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-300"
                      >
                        收起回覆
                      </button>
                    )}
                  </div>
                )}

                {/* ---- 回覆輸入框 ---- */}
                {isReplyingHere && (
                  <div className="ml-12 mt-3 pl-4 border-l-2 border-primary/30 dark:border-primary/40">
                    <div className="flex gap-2">
                      <Avatar
                        name={user?.displayName || user?.email}
                        size="w-7 h-7"
                        bg="bg-primary"
                        textColor="text-white"
                      />
                      <div className="flex-1">
                        <textarea
                          ref={replyTextareaRef}
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          maxLength={MAX_LENGTH}
                          rows={2}
                          className="w-full px-3 py-2 rounded-lg resize-none text-sm border
                                     bg-white text-neutral-900 placeholder-neutral-400 border-primary/40
                                     focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
                                     dark:bg-neutral-800 dark:text-neutral-100 dark:border-primary/50"
                        />
                        <div className="flex items-center justify-end gap-2 mt-1">
                          <button
                            onClick={() => {
                              setReplyingTo(null);
                              setReplyContent("");
                            }}
                            className="text-xs transition-colors text-neutral-400 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-300"
                          >
                            取消
                          </button>
                          <button
                            onClick={handleSubmitReply}
                            disabled={replySubmitting || !replyContent.trim()}
                            className="px-4 py-1.5 rounded-lg text-xs font-medium transition-colors
                                       bg-primary text-white hover:bg-primary-dark
                                       disabled:bg-neutral-300 disabled:text-neutral-500 disabled:cursor-not-allowed
                                       dark:disabled:bg-neutral-700 dark:disabled:text-neutral-500"
                          >
                            {replySubmitting ? "送出中..." : "送出回覆"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {/* 展開全部第一層留言 */}
          {!showAllTopLevel && sortedTopLevel.length > TOP_LEVEL_LIMIT && (
            <button
              onClick={() => setShowAllTopLevel(true)}
              className="w-full py-2 text-sm rounded-lg border transition-colors
                         text-primary border-primary/30 hover:bg-primary/5
                         dark:text-primary-light dark:border-primary-light/30 dark:hover:bg-primary/10"
            >
              展開全部留言(還有 {sortedTopLevel.length - TOP_LEVEL_LIMIT} 則)
            </button>
          )}
          {showAllTopLevel && sortedTopLevel.length > TOP_LEVEL_LIMIT && (
            <button
              onClick={() => setShowAllTopLevel(false)}
              className="w-full py-2 text-sm rounded-lg border transition-colors
                         text-neutral-500 border-neutral-200 hover:bg-neutral-100
                         dark:text-neutral-400 dark:border-neutral-800 dark:hover:bg-neutral-800"
            >
              收起留言
            </button>
          )}
        </div>
      )}

      {/* ========== 檢舉對話框 ========== */}
      {reportingComment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => !reportSubmitting && setReportingComment(null)}
        >
          <div
            className="w-full max-w-md p-6 rounded-2xl shadow-2xl
                       bg-white dark:bg-neutral-900"
            onClick={(e) => e.stopPropagation()}
          >
            {reportSuccess ? (
              <div className="text-center py-4">
                <p className="text-lg font-semibold text-success">已成功送出檢舉</p>
                <p className="text-sm mt-1 text-neutral-500 dark:text-neutral-400">
                  我們會盡快審查此留言
                </p>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-bold mb-1 text-neutral-900 dark:text-neutral-100">
                  檢舉留言
                </h3>
                <p className="text-sm mb-4 p-3 rounded-lg break-words
                              text-neutral-500 bg-neutral-100
                              dark:text-neutral-400 dark:bg-neutral-800">
                  「{reportingComment.content.slice(0, 80)}{reportingComment.content.length > 80 ? "..." : ""}」
                </p>

                {/* 檢舉原因 */}
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2 text-neutral-900 dark:text-neutral-100">
                    檢舉原因
                  </p>
                  <div className="space-y-2">
                    {[
                      { value: "spam", label: "垃圾訊息" },
                      { value: "inappropriate", label: "不當內容" },
                      { value: "harassment", label: "騷擾行為" },
                      { value: "other", label: "其他" },
                    ].map((option) => (
                      <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="reportReason"
                          value={option.value}
                          checked={reportReason === option.value}
                          onChange={(e) => setReportReason(e.target.value)}
                          className="accent-primary"
                        />
                        <span className="text-sm text-neutral-900 dark:text-neutral-100">
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 詳細說明 */}
                <div className="mb-5">
                  <p className="text-sm font-medium mb-1 text-neutral-900 dark:text-neutral-100">
                    詳細說明
                    <span className="ml-1 font-normal text-neutral-400 dark:text-neutral-500">
                      (選填)
                    </span>
                  </p>
                  <textarea
                    value={reportDetail}
                    onChange={(e) => setReportDetail(e.target.value)}
                    placeholder="請描述詳細情況..."
                    rows={3}
                    maxLength={300}
                    className="w-full px-3 py-2 text-sm rounded-lg resize-none border
                               bg-white text-neutral-900 placeholder-neutral-400 border-neutral-300
                               focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
                               dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500 dark:border-neutral-700"
                  />
                  <p className="text-xs text-right mt-0.5 text-neutral-400 dark:text-neutral-500">
                    {reportDetail.length} / 300
                  </p>
                </div>

                {/* 按鈕 */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setReportingComment(null)}
                    className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                               bg-neutral-100 text-neutral-700 hover:bg-neutral-200
                               dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleReport}
                    disabled={reportSubmitting}
                    className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                               bg-warning text-white hover:opacity-90
                               disabled:opacity-60"
                  >
                    {reportSubmitting ? "送出中..." : "送出檢舉"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
