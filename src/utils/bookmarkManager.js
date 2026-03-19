// ============================================
// 檔案名稱: bookmarkManager.js
// 路徑: src/utils/bookmarkManager.js
// 用途: 書籤管理（localStorage + Firestore 雙向同步）
// ============================================
import { setDocument, getDocument, deleteDocument, getSubCollectionDocs } from "../firebase/firestore";
import { auth } from "../firebase/config";

const BOOKMARKS_KEY = "bookmarks";

// ========== 同步狀態管理 ==========
let syncStatus = {
  isSyncing: false,
  lastSyncTime: null,
  error: null,
};

export function getBookmarkSyncStatus() {
  return { ...syncStatus };
}

// ========== localStorage 操作 ==========

function getLocalBookmarks() {
  try {
    return JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || "{}");
  } catch (error) {
    console.error("讀取本地書籤失敗:", error);
    return {};
  }
}

function saveLocalBookmarks(bookmarks) {
  try {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
  } catch (error) {
    console.error("儲存本地書籤失敗:", error);
  }
}

// ========== Firestore 操作 ==========

async function syncBookmarkToFirestore(novelId, data) {
  const user = auth.currentUser;
  if (!user) return;

  const collectionPath = `bookmarks/${user.uid}/novels`;
  await setDocument(collectionPath, novelId, data);
}

async function deleteBookmarkFromFirestore(novelId) {
  const user = auth.currentUser;
  if (!user) return;

  const collectionPath = `bookmarks/${user.uid}/novels`;
  await deleteDocument(collectionPath, novelId);
}

async function getFirestoreBookmark(novelId) {
  const user = auth.currentUser;
  if (!user) return null;

  const collectionPath = `bookmarks/${user.uid}/novels`;
  const doc = await getDocument(collectionPath, novelId);
  if (!doc) return null;

  return {
    chapter: doc.chapter,
    page: doc.page,
    timestamp: doc.timestamp || new Date().toISOString(),
  };
}

// ========== 公開 API ==========

/**
 * 取得指定小說的書籤
 * @param {string} novelId - 小說 ID
 * @returns {object|null} - {chapter, page, timestamp}
 */
export function getBookmark(novelId) {
  try {
    const bookmarks = getLocalBookmarks();
    return bookmarks[novelId] || null;
  } catch (error) {
    console.error("讀取書籤失敗:", error);
    return null;
  }
}

/**
 * 儲存書籤（立即存 localStorage，背景同步 Firestore）
 * @param {string} novelId - 小說 ID
 * @param {number} chapter - 章節編號
 * @param {number} page - 分頁編號（預設 1）
 */
export function saveBookmark(novelId, chapter, page = 1) {
  try {
    const bookmarks = getLocalBookmarks();
    const data = {
      chapter,
      page,
      timestamp: new Date().toISOString(),
    };

    bookmarks[novelId] = data;
    saveLocalBookmarks(bookmarks);
    console.log(`✅ 書籤已儲存: ${novelId} - 第${chapter}章 - 頁${page}`);

    // 背景同步到 Firestore
    const user = auth.currentUser;
    if (user) {
      syncStatus.isSyncing = true;
      syncBookmarkToFirestore(novelId, data)
        .then(() => {
          syncStatus.isSyncing = false;
          syncStatus.lastSyncTime = new Date().toISOString();
        })
        .catch((err) => {
          console.error("書籤同步 Firestore 失敗:", err);
          syncStatus.isSyncing = false;
          syncStatus.error = err.message;
        });
    }
  } catch (error) {
    console.error("儲存書籤失敗:", error);
  }
}

/**
 * 刪除書籤（立即刪 localStorage，背景刪 Firestore）
 * @param {string} novelId - 小說 ID
 */
export function removeBookmark(novelId) {
  try {
    const bookmarks = getLocalBookmarks();
    delete bookmarks[novelId];
    saveLocalBookmarks(bookmarks);
    console.log(`🗑️ 書籤已刪除: ${novelId}`);

    // 背景刪除 Firestore
    const user = auth.currentUser;
    if (user) {
      deleteBookmarkFromFirestore(novelId).catch((err) => {
        console.error("刪除 Firestore 書籤失敗:", err);
      });
    }
  } catch (error) {
    console.error("刪除書籤失敗:", error);
  }
}

/**
 * 取得所有書籤
 * @returns {object} - 所有書籤資料
 */
export function getAllBookmarks() {
  try {
    return getLocalBookmarks();
  } catch (error) {
    console.error("讀取所有書籤失敗:", error);
    return {};
  }
}

/**
 * 登入後同步：將 Firestore 所有書籤合併進 localStorage（聯集，以最新時間為準）
 */
export async function syncBookmarks() {
  const user = auth.currentUser;
  if (!user) return;

  console.log("🔄 開始同步書籤...");
  syncStatus.isSyncing = true;
  syncStatus.error = null;

  try {
    const localBookmarks = getLocalBookmarks();

    // 從 Firestore 拉取所有書籤（不限於 localStorage 已有的）
    const parentPath = `bookmarks/${user.uid}`;
    const firestoreDocs = await getSubCollectionDocs(parentPath, "novels");

    // 合併：以時間較新的那筆為準（聯集）
    const firestoreIds = new Set();
    firestoreDocs.forEach((docData) => {
      const id = docData.id;
      firestoreIds.add(id);
      const firestoreEntry = {
        chapter: docData.chapter,
        page: docData.page || 1,
        timestamp: docData.timestamp || new Date().toISOString(),
      };
      const local = localBookmarks[id];
      if (!local || new Date(firestoreEntry.timestamp) > new Date(local.timestamp)) {
        localBookmarks[id] = firestoreEntry;
      }
    });

    saveLocalBookmarks(localBookmarks);

    // 將 localStorage 有但 Firestore 沒有的書籤上傳
    const uploadPromises = Object.keys(localBookmarks)
      .filter((id) => !firestoreIds.has(id))
      .map((id) => syncBookmarkToFirestore(id, localBookmarks[id]));
    await Promise.all(uploadPromises);

    syncStatus.isSyncing = false;
    syncStatus.lastSyncTime = new Date().toISOString();
    console.log("✅ 書籤同步完成");
  } catch (error) {
    console.error("❌ 書籤同步失敗:", error);
    syncStatus.isSyncing = false;
    syncStatus.error = error.message;
  }
}
