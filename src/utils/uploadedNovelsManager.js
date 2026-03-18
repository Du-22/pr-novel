// ============================================
// 檔案名稱: uploadedNovelsManager.js
// 路徑: src/utils/uploadedNovelsManager.js
// 用途: 使用者上傳小說管理（localStorage + Firestore 雙向同步）
// ============================================
import {
  uploadNovelToFirestore,
  updateNovel,
  deleteNovel,
  getUserNovels,
} from "../firebase/novels";

const UPLOADED_NOVELS_KEY = "uploadedNovels";

// ========== localStorage 操作 ==========

export const getUploadedNovels = () => {
  try {
    const novels = localStorage.getItem(UPLOADED_NOVELS_KEY);
    return novels ? JSON.parse(novels) : [];
  } catch (error) {
    console.error("讀取上傳小說失敗:", error);
    return [];
  }
};

export const saveUploadedNovel = (novelData) => {
  const existingNovels = getUploadedNovels();
  const newId = `uploaded-${Date.now()}`;

  const newNovel = {
    id: newId,
    ...novelData,
    firestoreId: null, // 尚未同步到 Firestore
    createdAt: new Date().toISOString(),
    stats: { views: 0, favorites: 0 },
    isTemp: true,
  };

  const updatedNovels = [...existingNovels, newNovel];
  localStorage.setItem(UPLOADED_NOVELS_KEY, JSON.stringify(updatedNovels));
  return newNovel;
};

export const deleteUploadedNovel = (novelId) => {
  const existingNovels = getUploadedNovels();
  const updatedNovels = existingNovels.filter((n) => n.id !== novelId);
  localStorage.setItem(UPLOADED_NOVELS_KEY, JSON.stringify(updatedNovels));
};

export const getUploadedNovelById = (novelId) => {
  const novels = getUploadedNovels();
  return novels.find((n) => n.id === novelId) || null;
};

export const updateUploadedNovel = (novelId, updatedData) => {
  const existingNovels = getUploadedNovels();
  const updatedNovels = existingNovels.map((novel) =>
    novel.id === novelId ? { ...novel, ...updatedData } : novel
  );
  localStorage.setItem(UPLOADED_NOVELS_KEY, JSON.stringify(updatedNovels));
};

export const getStorageUsage = () => {
  let total = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length + key.length;
    }
  }
  const totalMB = (total / (1024 * 1024)).toFixed(2);
  const limitMB = 5;
  const percentage = ((total / (limitMB * 1024 * 1024)) * 100).toFixed(1);
  return { used: totalMB, limit: limitMB, percentage };
};

// ========== Firestore 同步 ==========

/**
 * 將 localStorage 的小說上傳到 Firestore，並將 firestoreId 存回 localStorage
 */
export const syncUploadToFirestore = async (localId, userId) => {
  const novel = getUploadedNovelById(localId);
  if (!novel || !userId) return;

  try {
    const result = await uploadNovelToFirestore(novel, userId);
    // 將 Firestore 生成的 ID 存回 localStorage
    updateUploadedNovel(localId, { firestoreId: result.id, isTemp: false });
    console.log(`✅ 小說已同步至 Firestore: ${result.id}`);
    return result.id;
  } catch (error) {
    console.error("同步小說至 Firestore 失敗:", error);
    throw error;
  }
};

/**
 * 更新 Firestore 中的小說
 */
export const syncNovelUpdateToFirestore = async (firestoreId, updateData, userId) => {
  if (!firestoreId || !userId) return;
  try {
    await updateNovel(firestoreId, updateData, userId);
    console.log(`✅ Firestore 小說已更新: ${firestoreId}`);
  } catch (error) {
    console.error("更新 Firestore 小說失敗:", error);
  }
};

/**
 * 從 Firestore 刪除小說
 */
export const syncNovelDeleteFromFirestore = async (firestoreId, userId) => {
  if (!firestoreId || !userId) return;
  try {
    await deleteNovel(firestoreId, userId);
    console.log(`🗑️ Firestore 小說已刪除: ${firestoreId}`);
  } catch (error) {
    console.error("刪除 Firestore 小說失敗:", error);
  }
};

/**
 * 登入後從 Firestore 同步使用者小說到 localStorage（補齊跨裝置上傳的作品）
 */
export const syncNovelsFromFirestore = async (userId) => {
  if (!userId) return;

  console.log("🔄 開始同步小說列表...");
  try {
    const firestoreNovels = await getUserNovels(userId);
    const localNovels = getUploadedNovels();

    const localFirestoreIds = new Set(
      localNovels.map((n) => n.firestoreId).filter(Boolean)
    );

    // 找出 Firestore 有但 localStorage 沒有的（例如其他裝置上傳的）
    const novelsToAdd = firestoreNovels.filter(
      (n) => !localFirestoreIds.has(n.id)
    );

    if (novelsToAdd.length > 0) {
      const newLocalNovels = novelsToAdd.map((n) => ({
        id: `uploaded-${n.id}`,
        firestoreId: n.id,
        title: n.title,
        author: n.author,
        summary: n.summary,
        tags: n.tags,
        coverImage: n.coverImage,
        chapters: n.chapters || [],
        createdAt:
          n.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        stats: n.stats || { views: 0, favorites: 0 },
        isTemp: false,
      }));

      const merged = [...localNovels, ...newLocalNovels];
      localStorage.setItem(UPLOADED_NOVELS_KEY, JSON.stringify(merged));
      console.log(`✅ 從 Firestore 同步了 ${novelsToAdd.length} 本小說`);
    } else {
      console.log("✅ 小說列表已是最新");
    }
  } catch (error) {
    console.error("❌ 同步小說列表失敗:", error);
  }
};
