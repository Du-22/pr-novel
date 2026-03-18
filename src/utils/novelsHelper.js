// ============================================
// 檔案名稱: novelsHelper.js
// 路徑: src/utils/novelsHelper.js
// 用途: 小說資料統一存取介面（從 Firestore 快取讀取）
// ============================================
import { getAllNovels as fetchAllFromFirestore } from "../firebase/novels";

// 模組級快取
let _cache = [];
let _loaded = false;

/**
 * 從 Firestore 載入所有小說並填入快取
 * 在 App.js 啟動時呼叫一次
 */
export const loadAllNovels = async () => {
  try {
    const novels = await fetchAllFromFirestore();
    _cache = novels;
    _loaded = true;
    console.log(`✅ 載入 ${novels.length} 本小說`);
  } catch (error) {
    console.error("❌ 載入小說失敗:", error);
  }
};

/**
 * 重新整理快取（上傳/刪除/編輯後呼叫）
 */
export const refreshNovels = async () => {
  _loaded = false;
  await loadAllNovels();
};

/**
 * 取得所有小說（同步，從快取讀）
 */
export const getAllNovels = () => _cache;

/**
 * 根據 ID 取得小說（同步，從快取讀）
 */
export const getNovelById = (id) => _cache.find((n) => n.id === id) || null;

/**
 * 取得所有標籤（按出現次數排序）
 */
export const getAllTags = () => {
  const tagCounts = {};
  _cache.forEach((novel) => {
    novel.tags?.forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });
  return Object.keys(tagCounts).sort((a, b) => {
    if (tagCounts[b] !== tagCounts[a]) return tagCounts[b] - tagCounts[a];
    return a.localeCompare(b);
  });
};

export const isLoaded = () => _loaded;
