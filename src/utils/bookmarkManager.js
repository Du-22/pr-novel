// ============================================
// 檔案名稱: bookmarkManager.js
// 路徑: src/utils/bookmarkManager.js
// 用途: 書籤管理（登入時直接讀寫 Firestore，未登入走 localStorage）
// ============================================
import { setDocument, deleteDocument, getDocument, getSubCollectionDocs } from "../firebase/firestore";
import { auth } from "../firebase/config";

const BOOKMARKS_KEY = "bookmarks";

// ========== localStorage ==========

function getLocalBookmarks() {
  try {
    return JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveLocalBookmarks(bookmarks) {
  try {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
  } catch {}
}

// ========== 公開 API ==========

/**
 * 取得指定小說的書籤（登入時讀 Firestore，未登入讀 localStorage）
 * @returns {Promise<{chapter, page, timestamp}|null>}
 */
export async function getBookmark(novelId) {
  const user = auth.currentUser;
  if (user) {
    try {
      const docData = await getDocument(`bookmarks/${user.uid}/novels`, novelId);
      if (docData) {
        const bm = { chapter: docData.chapter, page: docData.page || 1, timestamp: docData.timestamp };
        // 更新本地快取
        const local = getLocalBookmarks();
        local[novelId] = bm;
        saveLocalBookmarks(local);
        return bm;
      }
      return null;
    } catch (err) {
      console.error("讀取書籤失敗:", err);
      return getLocalBookmarks()[novelId] || null;
    }
  }
  return getLocalBookmarks()[novelId] || null;
}

/**
 * 儲存書籤（登入時寫 Firestore，同時更新 localStorage）
 */
export async function saveBookmark(novelId, chapter, page = 1) {
  const data = { chapter, page, timestamp: new Date().toISOString() };

  const bookmarks = getLocalBookmarks();
  bookmarks[novelId] = data;
  saveLocalBookmarks(bookmarks);

  const user = auth.currentUser;
  if (user) {
    await setDocument(`bookmarks/${user.uid}/novels`, novelId, data);
  }
}

/**
 * 刪除書籤（登入時刪 Firestore，同時更新 localStorage）
 */
export async function removeBookmark(novelId) {
  const bookmarks = getLocalBookmarks();
  delete bookmarks[novelId];
  saveLocalBookmarks(bookmarks);

  const user = auth.currentUser;
  if (user) {
    await deleteDocument(`bookmarks/${user.uid}/novels`, novelId);
  }
}

/**
 * 取得所有書籤（登入時讀 Firestore，未登入讀 localStorage）
 */
export async function getAllBookmarks() {
  const user = auth.currentUser;
  if (user) {
    try {
      const docs = await getSubCollectionDocs(`bookmarks/${user.uid}`, "novels");
      const result = {};
      docs.forEach((d) => {
        result[d.id] = { chapter: d.chapter, page: d.page || 1, timestamp: d.timestamp };
      });
      saveLocalBookmarks(result);
      return result;
    } catch (err) {
      console.error("讀取所有書籤失敗:", err);
      return getLocalBookmarks();
    }
  }
  return getLocalBookmarks();
}
