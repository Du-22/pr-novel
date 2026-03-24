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
 * 取得小說的已讀章節列表（登入時讀 Firestore，未登入讀 localStorage）
 * @returns {Promise<number[]>}
 */
export async function getReadChapters(novelId) {
  const user = auth.currentUser;
  if (user) {
    try {
      const docData = await getDocument(`readHistory/${user.uid}/novels`, novelId);
      if (docData) {
        const entry = { readChapters: docData.readChapters || [], lastRead: docData.lastRead || null };
        const local = getLocalHistory();
        local[novelId] = entry;
        saveLocalHistory(local);
        return entry.readChapters;
      }
      return [];
    } catch (err) {
      console.error("讀取已讀章節失敗:", err);
      return getLocalHistory()[novelId]?.readChapters || [];
    }
  }
  return getLocalHistory()[novelId]?.readChapters || [];
}

/**
 * 標記章節為已讀（登入時寫 Firestore，同時更新 localStorage）
 */
export async function markChapterAsRead(novelId, chapterNumber) {
  const history = getLocalHistory();
  if (!history[novelId]) {
    history[novelId] = { readChapters: [], lastRead: null };
  }
  if (!history[novelId].readChapters.includes(chapterNumber)) {
    history[novelId].readChapters.push(chapterNumber);
    history[novelId].readChapters.sort((a, b) => a - b);
  }
  history[novelId].lastRead = new Date().toISOString();
  saveLocalHistory(history);

  const user = auth.currentUser;
  if (user) {
    await setDocument(`readHistory/${user.uid}/novels`, novelId, history[novelId]);
  }
}

/**
 * 取得所有閱讀記錄（登入時讀 Firestore，未登入讀 localStorage）
 * @returns {Promise<{[novelId]: {readChapters: number[], lastRead: string}}>}
 */
export async function getAllReadHistory() {
  const user = auth.currentUser;
  if (user) {
    try {
      const docs = await getSubCollectionDocs(`readHistory/${user.uid}`, "novels");
      const result = {};
      docs.forEach((d) => {
        result[d.id] = { readChapters: d.readChapters || [], lastRead: d.lastRead || null };
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

/**
 * 清除小說的閱讀記錄（僅清 localStorage，不清 Firestore）
 */
export function clearReadHistory(novelId) {
  try {
    const history = getLocalHistory();
    delete history[novelId];
    saveLocalHistory(history);
  } catch (err) {
    console.error("清除閱讀記錄失敗:", err);
  }
}
