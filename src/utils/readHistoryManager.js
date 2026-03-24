// ============================================
// 檔案名稱: readHistoryManager.js
// 路徑: src/utils/readHistoryManager.js
// 用途: 閱讀記錄管理（登入時直接讀寫 Firestore，未登入走 localStorage）
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

// ========== 公開 API ==========

/**
 * 取得單本小說的閱讀資料 { readChapters, lastChapter, lastRead }
 * 一次讀取，避免多次 Firestore 查詢
 */
export async function getNovelReadData(novelId) {
  const user = auth.currentUser;
  if (user) {
    try {
      const docData = await getDocument(`readHistory/${user.uid}/novels`, novelId);
      if (docData) {
        const entry = {
          readChapters: docData.readChapters || [],
          lastChapter: docData.lastChapter || null,
          lastRead: docData.lastRead || null,
        };
        const local = getLocalHistory();
        local[novelId] = entry;
        saveLocalHistory(local);
        return entry;
      }
      return { readChapters: [], lastChapter: null, lastRead: null };
    } catch (err) {
      console.error("讀取閱讀資料失敗:", err);
      const local = getLocalHistory()[novelId];
      return {
        readChapters: local?.readChapters || [],
        lastChapter: local?.lastChapter || null,
        lastRead: local?.lastRead || null,
      };
    }
  }
  const local = getLocalHistory()[novelId];
  return {
    readChapters: local?.readChapters || [],
    lastChapter: local?.lastChapter || null,
    lastRead: local?.lastRead || null,
  };
}

/**
 * 取得小說的已讀章節列表
 * @returns {Promise<number[]>}
 */
export async function getReadChapters(novelId) {
  const { readChapters } = await getNovelReadData(novelId);
  return readChapters;
}

/**
 * 標記章節為已讀，同時記錄 lastChapter
 */
export async function markChapterAsRead(novelId, chapterNumber) {
  const history = getLocalHistory();
  if (!history[novelId]) {
    history[novelId] = { readChapters: [], lastChapter: null, lastRead: null };
  }
  if (!history[novelId].readChapters.includes(chapterNumber)) {
    history[novelId].readChapters.push(chapterNumber);
    history[novelId].readChapters.sort((a, b) => a - b);
  }
  history[novelId].lastChapter = chapterNumber;
  history[novelId].lastRead = new Date().toISOString();
  saveLocalHistory(history);

  const user = auth.currentUser;
  if (user) {
    await setDocument(`readHistory/${user.uid}/novels`, novelId, history[novelId]);
  }
}

/**
 * 取得所有閱讀記錄（登入時讀 Firestore，未登入讀 localStorage）
 */
export async function getAllReadHistory() {
  const user = auth.currentUser;
  if (user) {
    try {
      const docs = await getSubCollectionDocs(`readHistory/${user.uid}`, "novels");
      const result = {};
      docs.forEach((d) => {
        result[d.id] = {
          readChapters: d.readChapters || [],
          lastChapter: d.lastChapter || null,
          lastRead: d.lastRead || null,
        };
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
  return Math.round((readChapters.length / totalChapters) * 100);
}
