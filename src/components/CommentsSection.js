// ============================================
// 檔案名稱: CommentsSection.js
// 路徑: src/components/CommentsSection.js
// 用途: 讀者評論區（樓層編號、巢狀回覆、@mention）
// ============================================
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
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
  bg = "bg-secondary/40",
  textColor = "text-primary",
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
    <span className="text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded mr-1">
      B{floor}
    </span>
  );
}

const TOP_LEVEL_LIMIT = 10; // 預設顯示第一層留言數
const REPLY_LIMIT = 2; // 預設顯示回覆數

export default function CommentsSection({
  novelId,
  novelTitle = "",
  chapterNumber = null,
  chapters = [],
}) {
  const { user } = useAuth();
  const location = useLocation();
  const [topLevelComments, setTopLevelComments] = useState([]);
  const [replyMap, setReplyMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [userNameMap, setUserNameMap] = useState({}); // { uid: displayName }

  // 折疊狀態
  const [showAllTopLevel, setShowAllTopLevel] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState({}); // { commentId: true }
  const [showDeletedIds, setShowDeletedIds] = useState(new Set());

  const toggleShowDeleted = (id) => {
    setShowDeletedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // 第一層留言輸入
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // 回覆狀態：記錄要回覆的第一層留言，以及 @mention 樓層
  const [replyingTo, setReplyingTo] = useState(null); // 第一層留言 object
  const [replyContent, setReplyContent] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);
  const replyTextareaRef = useRef(null);

  // 排序：'time' | 'likes'
  const [sortBy, setSortBy] = useState("likes");

  // 檢舉狀態
  const [reportingComment, setReportingComment] = useState(null);
  const [reportReason, setReportReason] = useState("spam");
  const [reportDetail, setReportDetail] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  // chapterNumber → title 對照表
  const chapterTitleMap = useMemo(() => {
    const map = {};
    chapters.forEach((c) => {
      map[c.chapterNumber] = c.title;
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

      // 閱讀頁：只顯示該章節留言；小說資訊頁：顯示全部
      const topLevel = all.filter(
        (c) =>
          !c.parentId &&
          (chapterNumber === null ? true : c.chapterNumber === chapterNumber),
      );
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

      // 批次取得最新暱稱（用於暱稱更改後同步顯示）
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
  }, [chapterNumber, itemsCol]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  // ========== URL hash 跳轉到指定留言 ==========
  useEffect(() => {
    if (loading || !location.hash?.startsWith("#comment-")) return;
    const targetId = location.hash.replace("#comment-", "");

    // 如果目標是頂層留言且被折疊，先展開
    const isTopLevel = topLevelComments.some((c) => c.id === targetId);
    if (isTopLevel) {
      setShowAllTopLevel(true);
    } else {
      // 找出是哪個 thread 的回覆並展開
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
      // Transaction：取得並遞增 topLevelCount
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
        floorNumber, // number: 1, 2, 3...
        parentId: null,
        replyCount: 0,
        chapterNumber: chapterNumber ?? null,
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

  // ========== 點擊回覆按鈕 ==========
  const handleReplyClick = (comment) => {
    // 不論回覆的是第一層還是回覆層，回覆都掛在第一層底下
    let firstLevel;
    let mentionFloor;

    if (!comment.parentId) {
      firstLevel = comment;
      mentionFloor = comment.floorNumber; // number → "B3"
    } else {
      firstLevel = topLevelComments.find((c) => c.id === comment.parentId);
      mentionFloor = comment.floorNumber; // string → "B3-2"
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

      // Transaction：取得並遞增父留言的 replyCount
      const replyIndex = await runTransaction(db, async (transaction) => {
        const parentSnap = await transaction.get(parentDocRef);
        const current = parentSnap.exists()
          ? parentSnap.data().replyCount || 0
          : 0;
        const next = current + 1;
        transaction.update(parentDocRef, { replyCount: next });
        return next;
      });

      const parentFloor = replyingTo.floorNumber; // number
      const replyFloor = `${parentFloor}-${replyIndex}`; // e.g. "3-6"

      const replyId = `reply-${Date.now()}`;
      await setDoc(doc(db, itemsCol, replyId), {
        content: replyContent.trim(),
        authorUid: user.uid,
        authorName: user.displayName || user.email.split("@")[0],
        floorNumber: replyFloor, // string: "3-6"
        parentId: replyingTo.id,
        parentFloor, // number: 3
        chapterNumber: chapterNumber ?? null,
        createdAt: new Date(),
      });

      // 通知被回覆的留言作者（不通知自己）
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

  // ========== 刪除留言（軟刪除） ==========
  const handleDelete = async (commentId) => {
    if (!window.confirm("確定要刪除這則留言嗎？")) return;
    try {
      await updateDoc(doc(db, itemsCol, commentId), {
        deleted: true,
        deletedAt: serverTimestamp(),
      });
      await loadComments();
    } catch (err) {
      console.error("刪除留言失敗:", err);
      alert("刪除失敗，請稍後再試");
    }
  };

  // ========== 按讚 ==========
  const handleLike = async (comment) => {
    if (!user) return;

    const isReply = !!comment.parentId;
    const likedBy = comment.likedBy || [];
    const alreadyLiked = likedBy.includes(user.uid);

    // 樂觀更新
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

    // 背景同步 Firestore
    try {
      const ref = doc(db, itemsCol, comment.id);
      await updateDoc(ref, {
        likedBy: alreadyLiked ? arrayRemove(user.uid) : arrayUnion(user.uid),
      });

      // 按讚時通知留言作者（不通知自己、不在取消讚時通知）
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
      // 失敗時回滾（重新載入）
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
    const toDate = (ts) => ts?.toDate ? ts.toDate() : new Date(ts);
    if (sortBy === "likes") {
      return [...topLevelComments].sort(
        (a, b) => (b.likedBy?.length || 0) - (a.likedBy?.length || 0),
      );
    }
    if (sortBy === "oldest") {
      return [...topLevelComments].sort((a, b) => toDate(a.createdAt) - toDate(b.createdAt));
    }
    // 最新在前（createdAt desc）
    return [...topLevelComments].sort((a, b) => toDate(b.createdAt) - toDate(a.createdAt));
  }, [topLevelComments, sortBy]);

  const totalCount =
    topLevelComments.length +
    Object.values(replyMap).reduce((sum, arr) => sum + arr.length, 0);

  // 取得最新暱稱（有 userNameMap 就用最新的，否則 fallback 到留言當時的名稱）
  const getDisplayName = (comment) => userNameMap[comment.authorUid] || comment.authorName;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-dark">
          讀者留言
          {totalCount > 0 && (
            <span className="ml-2 text-lg font-normal text-gray-500">
              ({totalCount})
            </span>
          )}
        </h2>
        {topLevelComments.length > 0 && (
          <div className="flex items-center gap-1 text-sm">
            <button
              onClick={() => setSortBy("likes")}
              className={`px-3 py-1 rounded-full transition-colors ${
                sortBy === "likes"
                  ? "bg-primary text-white"
                  : "text-gray-500 hover:text-primary"
              }`}
            >
              熱門
            </button>
            <button
              onClick={() => setSortBy("oldest")}
              className={`px-3 py-1 rounded-full transition-colors ${
                sortBy === "oldest"
                  ? "bg-primary text-white"
                  : "text-gray-500 hover:text-primary"
              }`}
            >
              按時間
            </button>
            <button
              onClick={() => setSortBy("time")}
              className={`px-3 py-1 rounded-full transition-colors ${
                sortBy === "time"
                  ? "bg-primary text-white"
                  : "text-gray-500 hover:text-primary"
              }`}
            >
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none
                         focus:outline-none focus:ring-2 focus:ring-primary/50 text-dark"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-400">
                  {content.length} / {MAX_LENGTH}
                </span>
                <div className="flex items-center gap-3">
                  {error && (
                    <span className="text-sm text-red-500">{error}</span>
                  )}
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
          <p className="text-gray-600 mb-2">登入後才能留下留言</p>
          <Link
            to="/auth"
            className="text-primary font-medium hover:text-primary/80 transition-colors"
          >
            前往登入
          </Link>
        </div>
      )}

      {/* ========== 留言列表 ========== */}
      {loading ? (
        <p className="text-gray-400 text-center py-6">載入中...</p>
      ) : topLevelComments.length === 0 ? (
        <p className="text-gray-400 text-center py-6">
          還沒有留言，來留下第一則吧
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
                              <span className="text-xs bg-red-100 text-red-500 px-1.5 py-0.5 rounded">已刪除</span>
                              <button
                                onClick={() => toggleShowDeleted(comment.id)}
                                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                              >
                                隱藏
                              </button>
                            </div>
                            <p className="text-gray-500 text-sm leading-relaxed break-words line-through">
                              {comment.content}
                            </p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <p className="text-gray-400 text-sm italic">此留言已被刪除</p>
                            <button
                              onClick={() => toggleShowDeleted(comment.id)}
                              className="text-xs text-gray-400 hover:text-primary transition-colors"
                            >
                              顯示
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <FloorBadge floor={comment.floorNumber} />
                            <span className="font-medium text-dark text-sm">
                              {getDisplayName(comment)}
                            </span>
                            {chapterNumber === null && (
                              <span
                                className={`text-xs px-1.5 py-0.5 rounded ${
                                  comment.chapterNumber
                                    ? "text-primary bg-primary/10"
                                    : "text-gray-400 bg-gray-100"
                                }`}
                              >
                                {comment.chapterNumber
                                  ? `於 ${chapterTitleMap[comment.chapterNumber] || `第${comment.chapterNumber}章`} 留言`
                                  : "於 目錄頁 留言"}
                              </span>
                            )}
                            <span className="text-xs text-gray-400">
                              {formatDate(comment.createdAt)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            {/* 按讚 */}
                            <button
                              onClick={() => handleLike(comment)}
                              className={`flex items-center gap-1 text-xs transition-colors ${
                                user && comment.likedBy?.includes(user.uid)
                                  ? "text-primary font-medium"
                                  : "text-gray-400 hover:text-primary"
                              }`}
                            >
                              <span>
                                {user && comment.likedBy?.includes(user.uid)
                                  ? "♥"
                                  : "♡"}
                              </span>
                              {comment.likedBy?.length > 0 && (
                                <span>{comment.likedBy.length}</span>
                              )}
                            </button>
                            {user && (
                              <button
                                onClick={() => handleReplyClick(comment)}
                                className="text-xs text-gray-400 hover:text-primary transition-colors"
                              >
                                回覆
                              </button>
                            )}
                            {(user?.uid === comment.authorUid || user?.uid === ADMIN_UID) && (
                              <button
                                onClick={() => handleDelete(comment.id)}
                                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                              >
                                刪除
                              </button>
                            )}
                            {user && user.uid !== comment.authorUid && (
                              <button
                                onClick={() => openReport(comment)}
                                className="text-xs text-gray-400 hover:text-orange-500 transition-colors"
                              >
                                檢舉
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-gray-700 text-sm leading-relaxed break-words">
                          {comment.content}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* ---- 回覆列表 ---- */}
                {replies.length > 0 && (
                  <div className="ml-12 mt-3 space-y-3 pl-4 border-l-2 border-gray-100">
                    {visibleReplies.map((reply) => (
                      <div key={reply.id} id={`comment-${reply.id}`} className="flex gap-3">
                        <Avatar name={getDisplayName(reply)} uid={reply.deleted ? undefined : reply.authorUid} size="w-7 h-7" />
                        <div className="flex-1">
                          {reply.deleted ? (
                            <div>
                              {showDeletedIds.has(reply.id) ? (
                                <div className="opacity-70">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs bg-red-100 text-red-500 px-1.5 py-0.5 rounded">已刪除</span>
                                    <button
                                      onClick={() => toggleShowDeleted(reply.id)}
                                      className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                      隱藏
                                    </button>
                                  </div>
                                  <p className="text-gray-500 text-sm leading-relaxed break-words line-through">
                                    {reply.content}
                                  </p>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <p className="text-gray-400 text-sm italic">此留言已被刪除</p>
                                  <button
                                    onClick={() => toggleShowDeleted(reply.id)}
                                    className="text-xs text-gray-400 hover:text-primary transition-colors"
                                  >
                                    顯示
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <FloorBadge floor={reply.floorNumber} />
                                  <span className="font-medium text-dark text-sm">
                                    {getDisplayName(reply)}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    {formatDate(reply.createdAt)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3">
                                  {/* 按讚 */}
                                  <button
                                    onClick={() => handleLike(reply)}
                                    className={`flex items-center gap-1 text-xs transition-colors ${
                                      user && reply.likedBy?.includes(user.uid)
                                        ? "text-primary font-medium"
                                        : "text-gray-400 hover:text-primary"
                                    }`}
                                  >
                                    <span>
                                      {user && reply.likedBy?.includes(user.uid)
                                        ? "♥"
                                        : "♡"}
                                    </span>
                                    {reply.likedBy?.length > 0 && (
                                      <span>{reply.likedBy.length}</span>
                                    )}
                                  </button>
                                  {user && (
                                    <button
                                      onClick={() => handleReplyClick(reply)}
                                      className="text-xs text-gray-400 hover:text-primary transition-colors"
                                    >
                                      回覆
                                    </button>
                                  )}
                                  {(user?.uid === reply.authorUid || user?.uid === ADMIN_UID) && (
                                    <button
                                      onClick={() => handleDelete(reply.id)}
                                      className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                      刪除
                                    </button>
                                  )}
                                  {user && user.uid !== reply.authorUid && (
                                    <button
                                      onClick={() => openReport(reply)}
                                      className="text-xs text-gray-400 hover:text-orange-500 transition-colors"
                                    >
                                      檢舉
                                    </button>
                                  )}
                                </div>
                              </div>
                              <p className="text-gray-700 text-sm leading-relaxed break-words">
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
                          setExpandedReplies((prev) => ({
                            ...prev,
                            [comment.id]: true,
                          }))
                        }
                        className="text-xs text-primary hover:text-primary/80 transition-colors"
                      >
                        展開 {hiddenReplyCount} 則回覆
                      </button>
                    )}
                    {isRepliesExpanded && replies.length > REPLY_LIMIT && (
                      <button
                        onClick={() =>
                          setExpandedReplies((prev) => ({
                            ...prev,
                            [comment.id]: false,
                          }))
                        }
                        className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        收起回覆
                      </button>
                    )}
                  </div>
                )}

                {/* ---- 回覆輸入框（顯示在該 thread 底部） ---- */}
                {isReplyingHere && (
                  <div className="ml-12 mt-3 pl-4 border-l-2 border-primary/30">
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
                          className="w-full px-3 py-2 border border-primary/40 rounded-lg resize-none
                                   focus:outline-none focus:ring-2 focus:ring-primary/50 text-dark text-sm"
                        />
                        <div className="flex items-center justify-end gap-2 mt-1">
                          <button
                            onClick={() => {
                              setReplyingTo(null);
                              setReplyContent("");
                            }}
                            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            取消
                          </button>
                          <button
                            onClick={handleSubmitReply}
                            disabled={replySubmitting || !replyContent.trim()}
                            className="px-4 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90
                                     transition-colors text-xs font-medium
                                     disabled:bg-gray-300 disabled:cursor-not-allowed"
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
          {/* 展開更多第一層留言 */}
          {!showAllTopLevel && sortedTopLevel.length > TOP_LEVEL_LIMIT && (
            <button
              onClick={() => setShowAllTopLevel(true)}
              className="w-full py-2 text-sm text-primary hover:text-primary/80 transition-colors border border-primary/30 rounded-lg"
            >
              展開全部留言（還有 {sortedTopLevel.length - TOP_LEVEL_LIMIT} 則）
            </button>
          )}
          {showAllTopLevel && sortedTopLevel.length > TOP_LEVEL_LIMIT && (
            <button
              onClick={() => setShowAllTopLevel(false)}
              className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors border border-gray-200 rounded-lg"
            >
              收起留言
            </button>
          )}
        </div>
      )}

      {/* ========== 檢舉對話框 ========== */}
      {reportingComment && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => !reportSubmitting && setReportingComment(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {reportSuccess ? (
              <div className="text-center py-4">
                <p className="text-green-600 font-semibold text-lg">已成功送出檢舉</p>
                <p className="text-gray-500 text-sm mt-1">我們會盡快審查此留言</p>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-bold text-dark mb-1">檢舉留言</h3>
                <p className="text-sm text-gray-500 mb-4 bg-gray-50 p-3 rounded-lg break-words">
                  「{reportingComment.content.slice(0, 80)}{reportingComment.content.length > 80 ? "..." : ""}」
                </p>

                {/* 檢舉原因 */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-dark mb-2">檢舉原因</p>
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
                        <span className="text-sm text-dark">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 詳細說明 */}
                <div className="mb-5">
                  <p className="text-sm font-medium text-dark mb-1">
                    詳細說明
                    <span className="text-gray-400 font-normal ml-1">（選填）</span>
                  </p>
                  <textarea
                    value={reportDetail}
                    onChange={(e) => setReportDetail(e.target.value)}
                    placeholder="請描述詳細情況..."
                    rows={3}
                    maxLength={300}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none text-sm
                             focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <p className="text-xs text-gray-400 text-right mt-0.5">
                    {reportDetail.length} / 300
                  </p>
                </div>

                {/* 按鈕 */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setReportingComment(null)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-dark rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleReport}
                    disabled={reportSubmitting}
                    className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium disabled:opacity-60"
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
