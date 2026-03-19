// ============================================
// 檔案名稱: storageHelper.js
// 路徑: src/firebase/storageHelper.js
// 用途: Firebase Cloud Storage 上傳工具
// ============================================
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "./config";

/**
 * 將 base64 字串轉換為 Blob
 */
function base64ToBlob(base64) {
  const arr = base64.split(",");
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new Blob([u8arr], { type: mime });
}

/**
 * 上傳封面圖片到 Storage
 * @param {string} userId - 使用者 UID
 * @param {string} base64 - 壓縮後的 base64 字串
 * @returns {Promise<string>} - 圖片的下載 URL
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
 * 上傳小說 TXT 檔案到 Storage
 * @param {string} novelId - 小說 Firestore ID
 * @param {File} file - TXT 檔案物件
 * @returns {Promise<string>} - TXT 的下載 URL
 */
export const uploadNovelTxt = async (novelId, file) => {
  const storageRef = ref(storage, `novels/${novelId}/content.txt`);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  console.log("✅ 小說 TXT 已上傳至 Storage:", url);
  return url;
};

/**
 * 上傳小說 TXT 文字內容到 Storage
 * @param {string} novelId - 小說 Firestore ID
 * @param {string} textContent - TXT 純文字內容
 * @returns {Promise<string>} - TXT 的下載 URL
 */
export const uploadNovelTxtContent = async (novelId, textContent) => {
  const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
  const storageRef = ref(storage, `novels/${novelId}/content.txt`);
  await uploadBytes(storageRef, blob);
  const url = await getDownloadURL(storageRef);
  console.log("✅ 小說 TXT 內容已上傳至 Storage:", url);
  return url;
};

/**
 * 刪除 Storage 中的封面圖片
 * @param {string} url - 圖片下載 URL
 */
export const deleteCoverImage = async (url) => {
  try {
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
    console.log("🗑️ 封面圖片已從 Storage 刪除");
  } catch (error) {
    // 找不到檔案也不阻擋流程
    console.warn("刪除封面圖片失敗（可能已不存在）:", error.message);
  }
};

/**
 * 刪除 Storage 中的小說 TXT
 * @param {string} novelId - 小說 Firestore ID
 */
export const deleteNovelTxt = async (novelId) => {
  try {
    const storageRef = ref(storage, `novels/${novelId}/content.txt`);
    await deleteObject(storageRef);
    console.log("🗑️ 小說 TXT 已從 Storage 刪除");
  } catch (error) {
    console.warn("刪除小說 TXT 失敗（可能已不存在）:", error.message);
  }
};
