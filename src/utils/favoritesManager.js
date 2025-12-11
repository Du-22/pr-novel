const FAVORITES_KEY = "userFavorites";

/**
 * 取得使用者的收藏列表
 * @returns {Array} - 收藏的小說 ID 陣列
 */
export function getFavorites() {
  try {
    const favorites = localStorage.getItem(FAVORITES_KEY);
    return favorites ? JSON.parse(favorites) : [];
  } catch (error) {
    console.error("讀取收藏列表失敗:", error);
    return [];
  }
}

/**
 * 檢查小說是否已收藏
 * @param {string} novelId - 小說 ID
 * @returns {boolean}
 */
export function isFavorited(novelId) {
  const favorites = getFavorites();
  return favorites.some((fav) => fav.novelId === novelId);
}

/**
 * 加入收藏
 * @param {string} novelId - 小說 ID
 */
export function addFavorite(novelId) {
  try {
    const favorites = getFavorites();

    // 檢查是否已收藏
    if (isFavorited(novelId)) {
      console.log("已經收藏過了:", novelId);
      return;
    }

    // 新增收藏
    favorites.push({
      novelId,
      timestamp: new Date().toISOString(),
    });

    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    console.log("✅ 加入收藏:", novelId);
  } catch (error) {
    console.error("加入收藏失敗:", error);
  }
}

/**
 * 取消收藏
 * @param {string} novelId - 小說 ID
 */
export function removeFavorite(novelId) {
  try {
    const favorites = getFavorites();
    const updated = favorites.filter((fav) => fav.novelId !== novelId);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    console.log("🗑️ 取消收藏:", novelId);
  } catch (error) {
    console.error("取消收藏失敗:", error);
  }
}

/**
 * 取得收藏的小說 ID 列表 (按收藏時間排序,最新在前)
 * @returns {Array} - 小說 ID 陣列
 */
export function getFavoriteNovelIds() {
  const favorites = getFavorites();
  // 按時間排序 (最新在前)
  favorites.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return favorites.map((fav) => fav.novelId);
}

/**
 * 取得收藏時間
 * @param {string} novelId - 小說 ID
 * @returns {string|null} - ISO 格式時間字串
 */
export function getFavoriteTimestamp(novelId) {
  const favorites = getFavorites();
  const favorite = favorites.find((fav) => fav.novelId === novelId);
  return favorite ? favorite.timestamp : null;
}

/**
 * 清空所有收藏
 */
export function clearAllFavorites() {
  try {
    localStorage.removeItem(FAVORITES_KEY);
    console.log("🗑️ 已清空所有收藏");
  } catch (error) {
    console.error("清空收藏失敗:", error);
  }
}
