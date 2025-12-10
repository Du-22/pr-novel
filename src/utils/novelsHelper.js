import { mockNovels } from "../data/mockData";
import {
  getUploadedNovels,
  getUploadedNovelById,
} from "./uploadedNovelsManager";

// ========== 取得所有小說 (mockData + 上傳的) ==========
export const getAllNovels = () => {
  const uploadedNovels = getUploadedNovels();
  return [...mockNovels, ...uploadedNovels];
};

// ========== 根據 ID 取得小說 ==========
export const getNovelById = (id) => {
  // 先找 mockData
  const mockNovel = mockNovels.find((n) => n.id === id);
  if (mockNovel) return mockNovel;

  // 再找上傳的小說
  const uploadedNovel = getUploadedNovelById(id);
  return uploadedNovel || null;
};

// ========== 動態計算所有標籤 (包含上傳的小說) ==========
export const getAllTags = () => {
  const allNovels = getAllNovels();

  // 計算每個標籤的數量
  const tagCounts = {};
  allNovels.forEach((novel) => {
    novel.tags.forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  // 按數量排序 (由多到少)
  return Object.keys(tagCounts).sort((a, b) => {
    if (tagCounts[b] !== tagCounts[a]) {
      return tagCounts[b] - tagCounts[a];
    }
    return a.localeCompare(b);
  });
};
