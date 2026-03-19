// ============================================
// 檔案名稱: users.js
// 路徑: src/firebase/users.js
// 用途: 使用者公開資料（顯示名稱）Firestore 操作
// ============================================
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "./config";

/**
 * 儲存/更新使用者公開資料（登入時自動呼叫）
 */
export const saveUserProfile = async (uid, displayName, email) => {
  try {
    await setDoc(
      doc(db, "users", uid),
      {
        displayName: displayName || email?.split("@")[0] || "使用者",
        email: email || "",
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("儲存使用者資料失敗:", error);
  }
};

/**
 * 更新使用者公開資料（部分欄位）
 */
export const updateUserProfile = async (uid, data) => {
  try {
    await setDoc(
      doc(db, "users", uid),
      { ...data, updatedAt: new Date().toISOString() },
      { merge: true }
    );
  } catch (error) {
    console.error("更新使用者資料失敗:", error);
    throw error;
  }
};

/**
 * 取得使用者公開資料
 */
export const getUserProfile = async (uid) => {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? snap.data() : null;
  } catch (error) {
    console.error("讀取使用者資料失敗:", error);
    return null;
  }
};
