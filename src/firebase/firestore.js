import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./config";

// ========== 通用 CRUD 操作 ==========

/**
 * 新增或更新文件
 * @param {string} collectionPath - Collection 路徑
 * @param {string} docId - 文件 ID
 * @param {object} data - 要儲存的資料
 * @returns {Promise<void>}
 */
export const setDocument = async (collectionPath, docId, data) => {
  try {
    const docRef = doc(db, collectionPath, docId);
    await setDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    console.log(`✅ 文件已儲存: ${collectionPath}/${docId}`);
  } catch (error) {
    console.error(`❌ 儲存文件失敗: ${collectionPath}/${docId}`, error);
    throw error;
  }
};

/**
 * 取得單一文件
 * @param {string} collectionPath - Collection 路徑
 * @param {string} docId - 文件 ID
 * @returns {Promise<object|null>}
 */
export const getDocument = async (collectionPath, docId) => {
  try {
    const docRef = doc(db, collectionPath, docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      };
    }
    return null;
  } catch (error) {
    console.error(`❌ 讀取文件失敗: ${collectionPath}/${docId}`, error);
    throw error;
  }
};

/**
 * 更新文件（部分更新）
 * @param {string} collectionPath - Collection 路徑
 * @param {string} docId - 文件 ID
 * @param {object} data - 要更新的資料
 * @returns {Promise<void>}
 */
export const updateDocument = async (collectionPath, docId, data) => {
  try {
    const docRef = doc(db, collectionPath, docId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    console.log(`✅ 文件已更新: ${collectionPath}/${docId}`);
  } catch (error) {
    console.error(`❌ 更新文件失敗: ${collectionPath}/${docId}`, error);
    throw error;
  }
};

/**
 * 刪除文件
 * @param {string} collectionPath - Collection 路徑
 * @param {string} docId - 文件 ID
 * @returns {Promise<void>}
 */
export const deleteDocument = async (collectionPath, docId) => {
  try {
    const docRef = doc(db, collectionPath, docId);
    await deleteDoc(docRef);
    console.log(`✅ 文件已刪除: ${collectionPath}/${docId}`);
  } catch (error) {
    console.error(`❌ 刪除文件失敗: ${collectionPath}/${docId}`, error);
    throw error;
  }
};

/**
 * 取得 Collection 中的所有文件
 * @param {string} collectionPath - Collection 路徑
 * @returns {Promise<Array>}
 */
export const getAllDocuments = async (collectionPath) => {
  try {
    const querySnapshot = await getDocs(collection(db, collectionPath));
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error(`❌ 讀取 Collection 失敗: ${collectionPath}`, error);
    throw error;
  }
};

/**
 * 查詢文件（帶條件）
 * @param {string} collectionPath - Collection 路徑
 * @param {Array} conditions - 查詢條件 [field, operator, value]
 * @param {string} orderByField - 排序欄位（選填）
 * @param {number} limitCount - 限制數量（選填）
 * @returns {Promise<Array>}
 */
export const queryDocuments = async (
  collectionPath,
  conditions = [],
  orderByField = null,
  limitCount = null
) => {
  try {
    let q = collection(db, collectionPath);

    // 加上查詢條件
    conditions.forEach(([field, operator, value]) => {
      q = query(q, where(field, operator, value));
    });

    // 加上排序
    if (orderByField) {
      q = query(q, orderBy(orderByField));
    }

    // 加上數量限制
    if (limitCount) {
      q = query(q, limit(limitCount));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error(`❌ 查詢失敗: ${collectionPath}`, error);
    throw error;
  }
};

// ========== SubCollection 專用操作 ==========

/**
 * 取得 SubCollection 中的所有文件
 * @param {string} parentPath - 父文件路徑 (例: "favorites/user123")
 * @param {string} subCollectionName - SubCollection 名稱 (例: "novels")
 * @returns {Promise<Array>}
 */
export const getSubCollectionDocs = async (parentPath, subCollectionName) => {
  try {
    const collectionPath = `${parentPath}/${subCollectionName}`;
    return await getAllDocuments(collectionPath);
  } catch (error) {
    console.error(
      `❌ 讀取 SubCollection 失敗: ${parentPath}/${subCollectionName}`,
      error
    );
    throw error;
  }
};

/**
 * 新增或更新 SubCollection 文件
 * @param {string} parentPath - 父文件路徑
 * @param {string} subCollectionName - SubCollection 名稱
 * @param {string} docId - 文件 ID
 * @param {object} data - 要儲存的資料
 * @returns {Promise<void>}
 */
export const setSubCollectionDoc = async (
  parentPath,
  subCollectionName,
  docId,
  data
) => {
  const collectionPath = `${parentPath}/${subCollectionName}`;
  return await setDocument(collectionPath, docId, data);
};

/**
 * 刪除 SubCollection 文件
 * @param {string} parentPath - 父文件路徑
 * @param {string} subCollectionName - SubCollection 名稱
 * @param {string} docId - 文件 ID
 * @returns {Promise<void>}
 */
export const deleteSubCollectionDoc = async (
  parentPath,
  subCollectionName,
  docId
) => {
  const collectionPath = `${parentPath}/${subCollectionName}`;
  return await deleteDocument(collectionPath, docId);
};

// ========== 批次操作 ==========

/**
 * 批次新增文件
 * @param {string} collectionPath - Collection 路徑
 * @param {Array} dataArray - 要新增的資料陣列 [{id, data}, ...]
 * @returns {Promise<void>}
 */
export const batchSetDocuments = async (collectionPath, dataArray) => {
  try {
    const promises = dataArray.map(({ id, data }) =>
      setDocument(collectionPath, id, data)
    );
    await Promise.all(promises);
    console.log(`✅ 批次儲存完成: ${dataArray.length} 個文件`);
  } catch (error) {
    console.error(`❌ 批次儲存失敗: ${collectionPath}`, error);
    throw error;
  }
};

/**
 * 批次刪除文件
 * @param {string} collectionPath - Collection 路徑
 * @param {Array} docIds - 要刪除的文件 ID 陣列
 * @returns {Promise<void>}
 */
export const batchDeleteDocuments = async (collectionPath, docIds) => {
  try {
    const promises = docIds.map((id) => deleteDocument(collectionPath, id));
    await Promise.all(promises);
    console.log(`✅ 批次刪除完成: ${docIds.length} 個文件`);
  } catch (error) {
    console.error(`❌ 批次刪除失敗: ${collectionPath}`, error);
    throw error;
  }
};

// ========== 檢查文件是否存在 ==========

/**
 * 檢查文件是否存在
 * @param {string} collectionPath - Collection 路徑
 * @param {string} docId - 文件 ID
 * @returns {Promise<boolean>}
 */
export const documentExists = async (collectionPath, docId) => {
  try {
    const docRef = doc(db, collectionPath, docId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  } catch (error) {
    console.error(`❌ 檢查文件失敗: ${collectionPath}/${docId}`, error);
    return false;
  }
};
