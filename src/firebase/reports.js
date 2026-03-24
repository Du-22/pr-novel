// ============================================
// 檔案名稱: reports.js
// 路徑: src/firebase/reports.js
// 用途: 留言檢舉 Firestore 操作
// ============================================
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./config";
import { createNotification } from "./notifications";
import { ADMIN_UID } from "../config/adminConfig";

const REPORT_REASON_LABELS = {
  spam: "垃圾訊息",
  inappropriate: "不當內容",
  harassment: "騷擾行為",
  other: "其他",
};

/**
 * 提交留言檢舉
 * 1. 寫入 reports 集合（Cloud Functions 監聽後寄 email）
 * 2. 寫入管理員的站內通知
 */
export const submitReport = async ({
  reportedCommentId,
  reportedContent,
  reportedAuthorName,
  reportedAuthorUid,
  reporterUid,
  reporterName,
  novelId,
  novelTitle,
  chapterNumber,
  reason,
  detail,
}) => {
  await addDoc(collection(db, "reports"), {
    reportedCommentId,
    reportedContent,
    reportedAuthorName,
    reportedAuthorUid: reportedAuthorUid || "",
    reporterUid,
    reporterName,
    novelId,
    novelTitle: novelTitle || "",
    chapterNumber: chapterNumber ?? null,
    reason,
    detail: detail?.trim() || "",
    status: "pending",
    createdAt: serverTimestamp(),
  });

  // 站內通知給管理員
  await createNotification(ADMIN_UID, {
    type: "report",
    fromUserName: reporterName,
    novelId,
    novelTitle: novelTitle || "",
    commentContent: reportedContent?.slice(0, 50) || "",
    reason: REPORT_REASON_LABELS[reason] || reason,
    chapterNumber: chapterNumber ?? null,
  });
};
