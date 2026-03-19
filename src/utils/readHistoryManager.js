// ============================================
// 檔案名稱: readHistoryManager.js
// 路徑: src/utils/readHistoryManager.js
// 用途: 閱讀記錄管理（localStorage + Firestore 雙向同步）
// ============================================
import { setDocument, getDocument, getSubCollectionDocs } from "../firebase/firestore";
import { auth } from "../firebase/config";

const READ_HISTORY_KEY = "readHistory";

// ========== localStorage 操作 ==========

function getLocalHistory() {
  try {
    return JSON.parse(localStorage.getItem(READ_HISTORY_KEY) || "{}");
  } catch (error) {
    console.error("讀取本地閱讀記錄失敗:", error);
    return {};
  }
}

function saveLocalHistory(history) {
  try {
    localStorage.setItem(READ_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error("儲存本地閱讀記錄失敗:", error);
  }
}

// ========== Firestore 操作 ==========

async function syncReadHistoryToFirestore(novelId, data) {
  const user = auth.currentUser;
  if (!user) return;

  const collectionPath = `readHistory/${user.uid}/novels`;
  await setDocument(collectionPath, novelId, data);
}

async function getFirestoreReadHistory(novelId) {
  const user = auth.currentUser;
  if (!user) return null;

  const collectionPath = `readHistory/${user.uid}/novels`;
  const doc = await getDocument(collectionPath, novelId);
  if (!doc) return null;

  return {
    readChapters: doc.readChapters || [],
    lastRead: doc.lastRead || null,
  };
}

// ========== 公開 API ==========

/**
 * 取得小說的已讀章節列表
 * @param {string} novelId - 小說 ID
 * @returns {Array} - 已讀章節編號陣列 [1, 2, 3]
 */
export function getReadChapters(novelId) {
  try {
    const history = getLocalHistory();
    return history[novelId]?.readChapters || [];
  } catch (error) {
    console.error("讀取已讀記錄失敗:", error);
    return [];
  }
}

/**
 * 標記章節為已讀（立即存 localStorage，背景同步 Firestore）
 * @param {string} novelId - 小說 ID
 * @param {number} chapterNumber - 章節編號
 */
export function markChapterAsRead(novelId, chapterNumber) {
  try {
    const history = getLocalHistory();

    if (!history[novelId]) {
      history[novelId] = {
        readChapters: [],
        lastRead: null,
      };
    }

    // 加入已讀章節（避免重複）
    if (!history[novelId].readChapters.includes(chapterNumber)) {
      history[novelId].readChapters.push(chapterNumber);
      history[novelId].readChapters.sort((a, b) => a - b);
    }

    history[novelId].lastRead = new Date().toISOString();
    saveLocalHistory(history);
    console.log(`✅ 標記為已讀: ${novelId} - 第${chapterNumber}章`);

    // 背景同步到 Firestore
    const user = auth.currentUser;
    if (user) {
      syncReadHistoryToFirestore(novelId, history[novelId]).catch((err) => {
        console.error("閱讀記錄同步 Firestore 失敗:", err);
      });
    }
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
    const history = getLocalHistory();
    delete history[novelId];
    saveLocalHistory(history);
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
    return getLocalHistory();
  } catch (error) {
    console.error("讀取所有閱讀記錄失敗:", error);
    return {};
  }
}

/**
 * 登入後同步：將 Firestore 所有閱讀記錄合併進 localStorage（取章節聯集）
 */
export async function syncReadHistory() {
  const user = auth.currentUser;
  if (!user) return;

  console.log("🔄 開始同步閱讀記錄...");

  try {
    const localHistory = getLocalHistory();

    // 從 Firestore 拉取所有閱讀記錄（不限於 localStorage 已有的）
    const parentPath = `readHistory/${user.uid}`;
    const firestoreDocs = await getSubCollectionDocs(parentPath, "novels");

    // 合併：取章節聯集，lastRead 取較新的（聯集）
    const firestoreIds = new Set();
    firestoreDocs.forEach((docData) => {
      const id = docData.id;
      firestoreIds.add(id);
      const firestoreEntry = {
        readChapters: docData.readChapters || [],
        lastRead: docData.lastRead || null,
      };
      const local = localHistory[id];
      if (!local) {
        localHistory[id] = firestoreEntry;
      } else {
        const mergedChapters = Array.from(
          new Set([...local.readChapters, ...firestoreEntry.readChapters])
        ).sort((a, b) => a - b);
        const localTime = local.lastRead ? new Date(local.lastRead) : new Date(0);
        const remoteTime = firestoreEntry.lastRead ? new Date(firestoreEntry.lastRead) : new Date(0);
        localHistory[id] = {
          readChapters: mergedChapters,
          lastRead: localTime > remoteTime ? local.lastRead : firestoreEntry.lastRead,
        };
      }
    });

    saveLocalHistory(localHistory);

    // 上傳 localStorage 有但 Firestore 沒有的
    const uploadPromises = Object.keys(localHistory)
      .filter((id) => !firestoreIds.has(id))
      .map((id) => syncReadHistoryToFirestore(id, localHistory[id]));
    await Promise.all(uploadPromises);

    console.log("✅ 閱讀記錄同步完成");
  } catch (error) {
    console.error("❌ 閱讀記錄同步失敗:", error);
  }
}
