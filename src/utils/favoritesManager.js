// ============================================
// 檔案名稱: favoritesManager.js
// 路徑: src/utils/favoritesManager.js
// 用途: 收藏管理（登入時直接讀寫 Firestore，未登入走 localStorage）
// ============================================
import { setDocument, deleteDocument, getSubCollectionDocs } from "../firebase/firestore";
import { auth } from "../firebase/config";

const FAVORITES_KEY = "userFavorites";

// 記憶體快取，避免重複讀取 Firestore（N+1 問題）
let _cache = null; // { uid: string, data: Array<{novelId, timestamp}> }

function invalidateCache() {
  _cache = null;
}

// ========== localStorage ==========

function getLocalFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveLocalFavorites(favorites) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch {}
}

// ========== 公開 API ==========

/**
 * 取得收藏列表（登入時讀 Firestore，未登入讀 localStorage）
 * 使用記憶體快取避免同一頁面週期內重複讀取
 */
export async function getFavorites() {
  const user = auth.currentUser;
  if (!user) {
    _cache = null;
    return getLocalFavorites();
  }

  if (_cache?.uid === user.uid) return _cache.data;

  try {
    const docs = await getSubCollectionDocs(`favorites/${user.uid}`, "novels");
    const data = docs.map((d) => ({
      novelId: d.id,
      timestamp: d.timestamp || new Date().toISOString(),
    }));
    saveLocalFavorites(data);
    _cache = { uid: user.uid, data };
    return data;
  } catch (err) {
    console.error("讀取收藏失敗:", err);
    return getLocalFavorites();
  }
}

export async function isFavorited(novelId) {
  const favorites = await getFavorites();
  return favorites.some((fav) => fav.novelId === novelId);
}

export async function addFavorite(novelId) {
  const data = { novelId, timestamp: new Date().toISOString() };

  const local = getLocalFavorites();
  if (!local.some((fav) => fav.novelId === novelId)) {
    local.push(data);
    saveLocalFavorites(local);
  }
  invalidateCache();

  const user = auth.currentUser;
  if (user) {
    await setDocument(`favorites/${user.uid}/novels`, novelId, data);
  }
}

export async function removeFavorite(novelId) {
  saveLocalFavorites(getLocalFavorites().filter((fav) => fav.novelId !== novelId));
  invalidateCache();

  const user = auth.currentUser;
  if (user) {
    await deleteDocument(`favorites/${user.uid}/novels`, novelId);
  }
}

export async function getFavoriteNovelIds() {
  const favorites = await getFavorites();
  return favorites.map((fav) => fav.novelId);
}

export async function getFavoriteTimestamp(novelId) {
  const favorites = await getFavorites();
  return favorites.find((fav) => fav.novelId === novelId)?.timestamp || null;
}
