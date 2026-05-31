// ============================================
// 檔案名稱: readHistoryManager.js
// 路徑: src/utils/readHistoryManager.js
// 用途: 閱讀記錄管理（登入時直接讀寫 Firestore，未登入走 localStorage）
//
// 資料結構（同時支援單卷 flat / 分卷 volumed):
// {
//   readChapters: [1,2,3]  (flat 模式，chapterNumber 陣列)
//             或 { 1:[0,1,2], 2:[0] }  (volumed 模式，依 volumeNumber 索引)
//   lastChapter: 5,         // chapterNumber
//   lastVolume: 1 | null,   // 分卷小說才有
//   lastPage: 3,
//   lastRead: ISO string
// }
// ============================================
import { setDocument, getDocument, getSubCollectionDocs } from "../firebase/firestore";
import { auth } from "../firebase/config";

const READ_HISTORY_KEY = "readHistory";

// ========== localStorage ==========

function getLocalHistory() {
  try {
    return JSON.parse(localStorage.getItem(READ_HISTORY_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveLocalHistory(history) {
  try {
    localStorage.setItem(READ_HISTORY_KEY, JSON.stringify(history));
  } catch {}
}

// ========== Helper:檢查章節是否已讀 ==========

/**
 * 同時支援 flat / volumed 兩種 readChapters 結構
 * @param {Array | Object} readChapters
 * @param {number} chapterNumber
 * @param {number | null} volumeNumber - 分卷小說傳卷號,單卷傳 null
 */
export function isChapterReadIn(readChapters, chapterNumber, volumeNumber = null) {
  if (Array.isArray(readChapters)) {
    return readChapters.includes(chapterNumber);
  }
  if (volumeNumber == null) return false;
  return readChapters?.[volumeNumber]?.includes(chapterNumber) ?? false;
}

// ========== Helper:計算總已讀章節數 ==========

export function countReadChapters(readChapters) {
  if (Array.isArray(readChapters)) return readChapters.length;
  if (!readChapters || typeof readChapters !== "object") return 0;
  return Object.values(readChapters).reduce(
    (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0),
    0
  );
}

// ========== 公開 API ==========

const emptyEntry = () => ({
  readChapters: [],
  lastChapter: null,
  lastVolume: null,
  lastPage: null,
  lastRead: null,
});

const normalizeEntry = (data) => ({
  readChapters: data?.readChapters ?? [],
  lastChapter: data?.lastChapter ?? null,
  lastVolume: data?.lastVolume ?? null,
  lastPage: data?.lastPage ?? null,
  lastRead: data?.lastRead ?? null,
});

/**
 * 取得單本小說的閱讀資料
 */
export async function getNovelReadData(novelId) {
  const user = auth.currentUser;
  if (user) {
    try {
      const docData = await getDocument(`readHistory/${user.uid}/novels`, novelId);
      if (docData) {
        const entry = normalizeEntry(docData);
        const local = getLocalHistory();
        local[novelId] = entry;
        saveLocalHistory(local);
        return entry;
      }
      return emptyEntry();
    } catch (err) {
      console.error("讀取閱讀資料失敗:", err);
      return normalizeEntry(getLocalHistory()[novelId]);
    }
  }
  return normalizeEntry(getLocalHistory()[novelId]);
}

/**
 * 取得小說的已讀章節列表(向後相容,只給 flat 小說用)
 * @returns {Promise<number[] | Object>}
 */
export async function getReadChapters(novelId) {
  const { readChapters } = await getNovelReadData(novelId);
  return readChapters;
}

/**
 * 標記章節為已讀
 * @param {string} novelId
 * @param {number} chapterNumber
 * @param {number} page - 預設 1
 * @param {number | null} volumeNumber - 分卷小說傳卷號,單卷傳 null(或省略)
 */
export async function markChapterAsRead(novelId, chapterNumber, page = 1, volumeNumber = null) {
  const history = getLocalHistory();
  if (!history[novelId]) {
    history[novelId] = emptyEntry();
  }

  // readChapters 結構依模式維持:flat = Array、volumed = Object
  if (volumeNumber == null) {
    // flat:用陣列
    if (!Array.isArray(history[novelId].readChapters)) {
      history[novelId].readChapters = [];
    }
    if (!history[novelId].readChapters.includes(chapterNumber)) {
      history[novelId].readChapters.push(chapterNumber);
      history[novelId].readChapters.sort((a, b) => a - b);
    }
  } else {
    // volumed:用物件 { vol: [ch...] }
    if (Array.isArray(history[novelId].readChapters)) {
      // 從 flat 升級到 volumed(理論上不該發生,因為 volumeMode 不可改)
      history[novelId].readChapters = {};
    }
    if (!history[novelId].readChapters[volumeNumber]) {
      history[novelId].readChapters[volumeNumber] = [];
    }
    const list = history[novelId].readChapters[volumeNumber];
    if (!list.includes(chapterNumber)) {
      list.push(chapterNumber);
      list.sort((a, b) => a - b);
    }
  }

  history[novelId].lastChapter = chapterNumber;
  history[novelId].lastVolume = volumeNumber; // null 代表 flat
  history[novelId].lastPage = page;
  history[novelId].lastRead = new Date().toISOString();
  saveLocalHistory(history);

  const user = auth.currentUser;
  if (user) {
    await setDocument(`readHistory/${user.uid}/novels`, novelId, history[novelId]);
  }
}

/**
 * 取得所有閱讀記錄
 */
export async function getAllReadHistory() {
  const user = auth.currentUser;
  if (user) {
    try {
      const docs = await getSubCollectionDocs(`readHistory/${user.uid}`, "novels");
      const result = {};
      docs.forEach((d) => {
        result[d.id] = normalizeEntry(d);
      });
      saveLocalHistory(result);
      return result;
    } catch (err) {
      console.error("讀取所有閱讀記錄失敗:", err);
      return getLocalHistory();
    }
  }
  return getLocalHistory();
}

/**
 * 取得閱讀進度百分比
 */
export function getReadingProgress(readChapters, totalChapters) {
  if (totalChapters === 0) return 0;
  return Math.round((countReadChapters(readChapters) / totalChapters) * 100);
}
