// ============================================
// 檔案名稱: notifications.js
// 路徑: src/firebase/notifications.js
// 用途: 站內通知 Firestore 操作
// ============================================
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "./config";

/**
 * 建立通知（寫入目標使用者的通知列）
 * @param {string} targetUserId - 收通知的使用者 UID
 * @param {object} data - { type, fromUserName, novelId, novelTitle, commentContent, chapterNumber }
 */
export const createNotification = async (targetUserId, data) => {
  if (!targetUserId) return;
  try {
    const colRef = collection(db, "notifications", targetUserId, "items");
    await addDoc(colRef, {
      ...data,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("建立通知失敗:", err);
  }
};

/**
 * 取得使用者的所有通知（時間倒序）
 * @param {string} userId
 * @returns {Promise<Array>}
 */
export const getNotifications = async (userId) => {
  try {
    const q = query(
      collection(db, "notifications", userId, "items"),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("讀取通知失敗:", err);
    return [];
  }
};

/**
 * 將所有未讀通知標記為已讀
 * @param {string} userId
 */
export const markAllNotificationsAsRead = async (userId) => {
  try {
    const snapshot = await getDocs(
      collection(db, "notifications", userId, "items")
    );
    const batch = writeBatch(db);
    snapshot.docs.forEach((d) => {
      if (!d.data().read) {
        batch.update(d.ref, { read: true });
      }
    });
    await batch.commit();
  } catch (err) {
    console.error("標記通知已讀失敗:", err);
  }
};
