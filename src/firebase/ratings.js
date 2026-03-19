// ============================================
// 檔案名稱: ratings.js
// 路徑: src/firebase/ratings.js
// 用途: 小說評分 Firestore 操作（一人一次，可修改）
// ============================================
import {
  doc,
  getDoc,
  setDoc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./config";

/**
 * 取得某本小說的評分統計（ratingSum, ratingCount）
 * @param {string} novelId
 * @returns {Promise<{ ratingSum: number, ratingCount: number }>}
 */
export const getRatingStats = async (novelId) => {
  try {
    const docRef = doc(db, "ratings", novelId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        ratingSum: data.ratingSum || 0,
        ratingCount: data.ratingCount || 0,
      };
    }
    return { ratingSum: 0, ratingCount: 0 };
  } catch (err) {
    console.error("取得評分統計失敗:", err);
    return { ratingSum: 0, ratingCount: 0 };
  }
};

/**
 * 取得使用者對某本小說的評分
 * @param {string} novelId
 * @param {string} userId
 * @returns {Promise<number|null>} - 1~5 或 null（未評分）
 */
export const getUserRating = async (novelId, userId) => {
  if (!userId) return null;
  try {
    const docRef = doc(db, "ratings", novelId, "users", userId);
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data().rating : null;
  } catch (err) {
    console.error("取得使用者評分失敗:", err);
    return null;
  }
};

/**
 * 提交或更新評分（使用 transaction 確保 ratingSum/ratingCount 正確）
 * @param {string} novelId
 * @param {string} userId
 * @param {number} rating - 1~5
 * @returns {Promise<void>}
 */
export const submitRating = async (novelId, userId, rating) => {
  if (!userId) throw new Error("需要登入才能評分");

  const userRatingRef = doc(db, "ratings", novelId, "users", userId);
  const statsRef = doc(db, "ratings", novelId);

  await runTransaction(db, async (transaction) => {
    const userRatingSnap = await transaction.get(userRatingRef);
    const statsSnap = await transaction.get(statsRef);

    const oldRating = userRatingSnap.exists() ? userRatingSnap.data().rating : null;
    const currentSum = statsSnap.exists() ? (statsSnap.data().ratingSum || 0) : 0;
    const currentCount = statsSnap.exists() ? (statsSnap.data().ratingCount || 0) : 0;

    // 寫入個人評分
    transaction.set(userRatingRef, {
      rating,
      timestamp: serverTimestamp(),
    });

    // 更新評分統計
    let newSum, newCount;
    if (oldRating === null) {
      newSum = currentSum + rating;
      newCount = currentCount + 1;
    } else {
      newSum = currentSum - oldRating + rating;
      newCount = currentCount;
    }

    transaction.set(statsRef, {
      ratingSum: newSum,
      ratingCount: newCount,
    });
  });
};
