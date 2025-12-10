const BOOKMARKS_KEY = "bookmarks";

/**
 * 取得指定小說的書籤
 * @param {string} novelId - 小說 ID
 * @returns {object|null} - {chapter, page, timestamp}
 */
export function getBookmark(novelId) {
  try {
    const bookmarks = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || "{}");
    return bookmarks[novelId] || null;
  } catch (error) {
    console.error("讀取書籤失敗:", error);
    return null;
  }
}

/**
 * 儲存書籤
 * @param {string} novelId - 小說 ID
 * @param {number} chapter - 章節編號
 * @param {number} scrollPosition - 捲動位置
 * @param {number} page - 分頁編號 (預設 1)
 */
export function saveBookmark(novelId, chapter, page = 1) {
  try {
    const bookmarks = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || "{}");

    bookmarks[novelId] = {
      chapter,
      page,
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
    console.log(`✅ 書籤已儲存: ${novelId} - 第${chapter}章 - 頁${page}`);
  } catch (error) {
    console.error("儲存書籤失敗:", error);
  }
}

/**
 * 刪除書籤
 * @param {string} novelId - 小說 ID
 */
export function removeBookmark(novelId) {
  try {
    const bookmarks = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || "{}");
    delete bookmarks[novelId];
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
    console.log(`🗑️ 書籤已刪除: ${novelId}`);
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
    return JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || "{}");
  } catch (error) {
    console.error("讀取所有書籤失敗:", error);
    return {};
  }
}
