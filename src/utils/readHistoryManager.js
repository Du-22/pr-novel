const READ_HISTORY_KEY = "readHistory";

/**
 * 取得小說的已讀章節列表
 * @param {string} novelId - 小說 ID
 * @returns {Array} - 已讀章節編號陣列 [1, 2, 3]
 */
export function getReadChapters(novelId) {
  try {
    const history = JSON.parse(localStorage.getItem(READ_HISTORY_KEY) || "{}");
    return history[novelId]?.readChapters || [];
  } catch (error) {
    console.error("讀取已讀記錄失敗:", error);
    return [];
  }
}

/**
 * 標記章節為已讀
 * @param {string} novelId - 小說 ID
 * @param {number} chapterNumber - 章節編號
 */
export function markChapterAsRead(novelId, chapterNumber) {
  try {
    const history = JSON.parse(localStorage.getItem(READ_HISTORY_KEY) || "{}");

    if (!history[novelId]) {
      history[novelId] = {
        readChapters: [],
        lastRead: null,
        totalTime: 0,
      };
    }

    // 加入已讀章節 (避免重複)
    if (!history[novelId].readChapters.includes(chapterNumber)) {
      history[novelId].readChapters.push(chapterNumber);
      history[novelId].readChapters.sort((a, b) => a - b); // 排序
    }

    // 更新最後閱讀時間
    history[novelId].lastRead = new Date().toISOString();

    localStorage.setItem(READ_HISTORY_KEY, JSON.stringify(history));
    console.log(`✅ 標記為已讀: ${novelId} - 第${chapterNumber}章`);
  } catch (error) {
    console.error("標記已讀失敗:", error);
  }
}

/**
 * 檢查章節是否已讀
 * @param {string} novelId - 小說 ID
 * @param {number} chapterNumber - 章節編號
 * @returns {boolean}
 */
export function isChapterRead(novelId, chapterNumber) {
  const readChapters = getReadChapters(novelId);
  return readChapters.includes(chapterNumber);
}

/**
 * 取得小說的閱讀進度百分比
 * @param {string} novelId - 小說 ID
 * @param {number} totalChapters - 總章節數
 * @returns {number} - 0-100
 */
export function getReadingProgress(novelId, totalChapters) {
  const readChapters = getReadChapters(novelId);
  if (totalChapters === 0) return 0;
  return Math.round((readChapters.length / totalChapters) * 100);
}

/**
 * 清除小說的閱讀記錄
 * @param {string} novelId - 小說 ID
 */
export function clearReadHistory(novelId) {
  try {
    const history = JSON.parse(localStorage.getItem(READ_HISTORY_KEY) || "{}");
    delete history[novelId];
    localStorage.setItem(READ_HISTORY_KEY, JSON.stringify(history));
    console.log(`🗑️ 閱讀記錄已清除: ${novelId}`);
  } catch (error) {
    console.error("清除閱讀記錄失敗:", error);
  }
}

/**
 * 取得所有閱讀記錄
 * @returns {object}
 */
export function getAllReadHistory() {
  try {
    return JSON.parse(localStorage.getItem(READ_HISTORY_KEY) || "{}");
  } catch (error) {
    console.error("讀取所有閱讀記錄失敗:", error);
    return {};
  }
}
