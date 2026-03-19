import {
  setDocument,
  deleteDocument,
  getSubCollectionDocs,
} from "../firebase/firestore";
import { auth } from "../firebase/config";

const FAVORITES_KEY = "userFavorites";

// ========== 同步狀態管理 ==========
let syncStatus = {
  isSyncing: false,
  lastSyncTime: null,
  error: null,
};

/**
 * 取得同步狀態
 * @returns {object} - {isSyncing, lastSyncTime, error}
 */
export function getSyncStatus() {
  return { ...syncStatus };
}

// ========== localStorage 操作（原有功能保留） ==========

/**
 * 取得使用者的收藏列表（從 localStorage）
 * @returns {Array} - 收藏的小說 ID 陣列
 */
function getLocalFavorites() {
  try {
    const favorites = localStorage.getItem(FAVORITES_KEY);
    return favorites ? JSON.parse(favorites) : [];
  } catch (error) {
    console.error("讀取本地收藏失敗:", error);
    return [];
  }
}

/**
 * 儲存到 localStorage
 * @param {Array} favorites - 收藏陣列
 */
function saveLocalFavorites(favorites) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch (error) {
    console.error("儲存本地收藏失敗:", error);
  }
}

// ========== Firestore 操作 ==========

/**
 * 同步單筆收藏到 Firestore
 * @param {string} novelId - 小說 ID
 * @param {object} data - 收藏資料 {novelId, timestamp}
 */
async function syncFavoriteToFirestore(novelId, data) {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const collectionPath = `favorites/${user.uid}/novels`;
    await setDocument(collectionPath, novelId, data);
    console.log(`✅ 收藏已同步至 Firestore: ${novelId}`);
  } catch (error) {
    console.error(`❌ 同步收藏失敗: ${novelId}`, error);
    throw error;
  }
}

/**
 * 從 Firestore 刪除收藏
 * @param {string} novelId - 小說 ID
 */
async function deleteFavoriteFromFirestore(novelId) {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const collectionPath = `favorites/${user.uid}/novels`;
    await deleteDocument(collectionPath, novelId);
    console.log(`🗑️ 已從 Firestore 刪除收藏: ${novelId}`);
  } catch (error) {
    console.error(`❌ 刪除 Firestore 收藏失敗: ${novelId}`, error);
    throw error;
  }
}

/**
 * 從 Firestore 讀取所有收藏
 * @returns {Promise<Array>} - 收藏陣列
 */
async function getFirestoreFavorites() {
  const user = auth.currentUser;
  if (!user) return [];

  try {
    const parentPath = `favorites/${user.uid}`;
    const docs = await getSubCollectionDocs(parentPath, "novels");

    return docs.map((doc) => ({
      novelId: doc.novelId,
      timestamp: doc.timestamp || new Date().toISOString(),
    }));
  } catch (error) {
    console.error("❌ 讀取 Firestore 收藏失敗:", error);
    return [];
  }
}

// ========== 聯集合併策略 ==========

/**
 * 合併 localStorage 和 Firestore 的收藏（聯集）
 * @param {Array} localFavorites - localStorage 收藏
 * @param {Array} firestoreFavorites - Firestore 收藏
 * @returns {Array} - 合併後的收藏（按時間排序，最新在前）
 */
function mergeFavorites(localFavorites, firestoreFavorites) {
  const merged = new Map();

  // 先加入 localStorage 的收藏
  localFavorites.forEach((fav) => {
    merged.set(fav.novelId, fav);
  });

  // 再加入 Firestore 的收藏（如果時間更新就覆蓋）
  firestoreFavorites.forEach((fav) => {
    const existing = merged.get(fav.novelId);
    if (!existing || new Date(fav.timestamp) > new Date(existing.timestamp)) {
      merged.set(fav.novelId, fav);
    }
  });

  // 轉成陣列並排序（最新在前）
  const result = Array.from(merged.values());
  result.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return result;
}

/**
 * 同步差異到 Firestore
 * @param {Array} mergedFavorites - 合併後的收藏
 * @param {Array} firestoreFavorites - Firestore 目前的收藏
 */
async function syncDifferencesToFirestore(mergedFavorites, firestoreFavorites) {
  const user = auth.currentUser;
  if (!user) return;

  const firestoreIds = new Set(firestoreFavorites.map((f) => f.novelId));
  const mergedIds = new Set(mergedFavorites.map((f) => f.novelId));

  // 找出需要新增到 Firestore 的
  const toAdd = mergedFavorites.filter((fav) => !firestoreIds.has(fav.novelId));

  // 找出需要從 Firestore 刪除的（不在合併結果中）
  const toDelete = firestoreFavorites.filter(
    (fav) => !mergedIds.has(fav.novelId)
  );

  // 批次同步
  const promises = [];

  toAdd.forEach((fav) => {
    promises.push(syncFavoriteToFirestore(fav.novelId, fav));
  });

  toDelete.forEach((fav) => {
    promises.push(deleteFavoriteFromFirestore(fav.novelId));
  });

  await Promise.all(promises);

  console.log(
    `🔄 同步完成: 新增 ${toAdd.length} 筆，刪除 ${toDelete.length} 筆`
  );
}

// ========== 公開 API ==========

/**
 * 取得使用者的收藏列表（只讀 localStorage，完整同步僅在登入時透過 syncFavorites() 執行）
 * @returns {Promise<Array>} - 收藏的小說陣列
 */
export async function getFavorites() {
  return getLocalFavorites();
}

/**
 * 檢查小說是否已收藏
 * @param {string} novelId - 小說 ID
 * @returns {Promise<boolean>}
 */
export async function isFavorited(novelId) {
  const favorites = await getFavorites();
  return favorites.some((fav) => fav.novelId === novelId);
}

/**
 * 加入收藏
 * @param {string} novelId - 小說 ID
 * @returns {Promise<void>}
 */
export async function addFavorite(novelId) {
  try {
    // 先檢查是否已收藏
    const favorites = getLocalFavorites();
    if (favorites.some((fav) => fav.novelId === novelId)) {
      console.log("已經收藏過了:", novelId);
      return;
    }

    // 新增到 localStorage（立即反應）
    const newFavorite = {
      novelId,
      timestamp: new Date().toISOString(),
    };

    favorites.push(newFavorite);
    saveLocalFavorites(favorites);
    console.log("✅ 加入收藏（本地）:", novelId);

    // 同步到 Firestore（背景執行）
    const user = auth.currentUser;
    if (user) {
      syncStatus.isSyncing = true;
      await syncFavoriteToFirestore(novelId, newFavorite);
      syncStatus.isSyncing = false;
      syncStatus.lastSyncTime = new Date().toISOString();
    }
  } catch (error) {
    console.error("加入收藏失敗:", error);
    syncStatus.isSyncing = false;
    syncStatus.error = error.message;

    // Firestore 失敗不影響 localStorage
    // 使用者仍然可以看到收藏
  }
}

/**
 * 取消收藏
 * @param {string} novelId - 小說 ID
 * @returns {Promise<void>}
 */
export async function removeFavorite(novelId) {
  try {
    // 先從 localStorage 移除（立即反應）
    const favorites = getLocalFavorites();
    const updated = favorites.filter((fav) => fav.novelId !== novelId);
    saveLocalFavorites(updated);
    console.log("🗑️ 取消收藏（本地）:", novelId);

    // 從 Firestore 刪除（背景執行）
    const user = auth.currentUser;
    if (user) {
      syncStatus.isSyncing = true;
      await deleteFavoriteFromFirestore(novelId);
      syncStatus.isSyncing = false;
      syncStatus.lastSyncTime = new Date().toISOString();
    }
  } catch (error) {
    console.error("取消收藏失敗:", error);
    syncStatus.isSyncing = false;
    syncStatus.error = error.message;

    // Firestore 失敗不影響 localStorage
  }
}

/**
 * 取得收藏的小說 ID 列表（按收藏時間排序，最新在前）
 * @returns {Promise<Array>} - 小說 ID 陣列
 */
export async function getFavoriteNovelIds() {
  const favorites = await getFavorites();
  return favorites.map((fav) => fav.novelId);
}

/**
 * 取得收藏時間
 * @param {string} novelId - 小說 ID
 * @returns {Promise<string|null>} - ISO 格式時間字串
 */
export async function getFavoriteTimestamp(novelId) {
  const favorites = await getFavorites();
  const favorite = favorites.find((fav) => fav.novelId === novelId);
  return favorite ? favorite.timestamp : null;
}

/**
 * 清空所有收藏
 * @returns {Promise<void>}
 */
export async function clearAllFavorites() {
  try {
    // 清空 localStorage
    localStorage.removeItem(FAVORITES_KEY);
    console.log("🗑️ 已清空本地收藏");

    // 清空 Firestore
    const user = auth.currentUser;
    if (user) {
      const firestoreFavorites = await getFirestoreFavorites();
      const promises = firestoreFavorites.map((fav) =>
        deleteFavoriteFromFirestore(fav.novelId)
      );
      await Promise.all(promises);
      console.log("🗑️ 已清空 Firestore 收藏");
    }
  } catch (error) {
    console.error("清空收藏失敗:", error);
  }
}

/**
 * 手動觸發完整同步（用於登入後）
 * @returns {Promise<void>}
 */
export async function syncFavorites() {
  const user = auth.currentUser;
  if (!user) return;

  console.log("🔄 開始同步收藏...");
  syncStatus.isSyncing = true;
  syncStatus.error = null;

  try {
    const localFavorites = getLocalFavorites();
    const firestoreFavorites = await getFirestoreFavorites();

    const mergedFavorites = mergeFavorites(localFavorites, firestoreFavorites);
    await syncDifferencesToFirestore(mergedFavorites, firestoreFavorites);
    saveLocalFavorites(mergedFavorites);

    syncStatus.isSyncing = false;
    syncStatus.lastSyncTime = new Date().toISOString();
    console.log("✅ 收藏同步完成");
  } catch (error) {
    console.error("❌ 同步收藏失敗:", error);
    syncStatus.isSyncing = false;
    syncStatus.error = error.message;
  }
}
