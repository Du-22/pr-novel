// ============================================
// 檔案名稱: storageHelper.js
// 路徑: src/firebase/storageHelper.js
// 用途: Firebase Cloud Storage 上傳/讀取/刪除工具
//       - 封面圖片: covers/{userId}/{timestamp}.jpg
//       - 章節內文: novels/{novelId}/chapters/{chapterNumber}.txt
// ============================================
import {
  ref,
  uploadBytes,
  getDownloadURL,
  getBytes,
  deleteObject,
  listAll,
} from "firebase/storage";
import { storage } from "./config";

// ========== base64 → Blob（封面用） ==========
function base64ToBlob(base64) {
  const arr = base64.split(",");
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new Blob([u8arr], { type: mime });
}

// ========== 封面 ==========

/**
 * 上傳封面圖片到 Storage
 */
export const uploadCoverImage = async (userId, base64) => {
  const blob = base64ToBlob(base64);
  const timestamp = Date.now();
  const storageRef = ref(storage, `covers/${userId}/${timestamp}.jpg`);
  await uploadBytes(storageRef, blob);
  const url = await getDownloadURL(storageRef);
  console.log("✅ 封面圖片已上傳至 Storage:", url);
  return url;
};

/**
 * 刪除 Storage 中的封面圖片
 */
export const deleteCoverImage = async (url) => {
  try {
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
    console.log("🗑️ 封面圖片已從 Storage 刪除");
  } catch (error) {
    console.warn("刪除封面圖片失敗（可能已不存在）:", error.message);
  }
};

// ========== 章節內文 ==========

/**
 * 上傳單一章節內文到 Storage
 * @param {string} novelId - 小說 Firestore ID
 * @param {number} chapterNumber - 章節編號
 * @param {string} content - 章節純文字內容
 * @returns {Promise<string>} - 下載 URL
 */
export const uploadChapterContent = async (novelId, chapterNumber, content) => {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const storageRef = ref(
    storage,
    `novels/${novelId}/chapters/${chapterNumber}.txt`
  );
  await uploadBytes(storageRef, blob);
  return await getDownloadURL(storageRef);
};

/**
 * 從 download URL 讀取章節內文
 * @param {string} url - Storage download URL
 * @returns {Promise<string>}
 */
export const fetchChapterContent = async (url) => {
  if (!url) return "";
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`讀取章節內文失敗: ${res.status}`);
  }
  return await res.text();
};

/**
 * 刪除單一章節內文
 */
export const deleteChapterContent = async (novelId, chapterNumber) => {
  try {
    const storageRef = ref(
      storage,
      `novels/${novelId}/chapters/${chapterNumber}.txt`
    );
    await deleteObject(storageRef);
  } catch (error) {
    console.warn(
      `刪除章節 ${chapterNumber} 內文失敗（可能已不存在）:`,
      error.message
    );
  }
};

/**
 * 刪除小說底下所有章節內文（刪小說時用）
 */
export const deleteAllChaptersOfNovel = async (novelId) => {
  try {
    const folderRef = ref(storage, `novels/${novelId}/chapters`);
    const list = await listAll(folderRef);
    await Promise.all(
      list.items.map((itemRef) =>
        deleteObject(itemRef).catch((e) =>
          console.warn(`刪 ${itemRef.fullPath} 失敗:`, e.message)
        )
      )
    );
    console.log(`🗑️ 已清除小說 ${novelId} 的所有章節內文`);
  } catch (error) {
    console.warn(`列出/清除章節資料夾失敗:`, error.message);
  }
};

// ========== 通用工具 ==========

/**
 * 給定一批 async 工作，限制同時最多 N 個並發，逐筆呼叫 onProgress
 * @param {Array} items - 要處理的項目陣列
 * @param {number} concurrency - 同時並發數
 * @param {(item, index) => Promise<any>} worker - 處理函式
 * @param {(done, total) => void} [onProgress] - 進度 callback
 * @returns {Promise<Array>} - 結果陣列（順序與 items 一致）
 */
export const runWithConcurrency = async (
  items,
  concurrency,
  worker,
  onProgress
) => {
  const results = new Array(items.length);
  let cursor = 0;
  let done = 0;
  const total = items.length;

  const runOne = async () => {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await worker(items[i], i);
      done++;
      if (onProgress) onProgress(done, total);
    }
  };

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, runOne);
  await Promise.all(workers);
  return results;
};

// 給 getBytes 用（ReadingPage 用）
export { getBytes };
