// ============================================
// 檔案名稱: uploadedNovelsManager.test.js
// 路徑: src/utils/uploadedNovelsManager.test.js
// 用途: 驗證本機上傳紀錄與 Firestore 的刪除同步
// ============================================

import {
  deleteUploadedNovel,
  getUploadedNovels,
  syncNovelsFromFirestore,
} from "./uploadedNovelsManager";
import { getUserNovels } from "../firebase/novels";

jest.mock("../firebase/novels", () => ({
  uploadNovelToFirestore: jest.fn(),
  updateNovel: jest.fn(),
  deleteNovel: jest.fn(),
  getUserNovels: jest.fn(),
}));

const setUploadedNovels = (novels) => {
  localStorage.setItem("uploadedNovels", JSON.stringify(novels));
};

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

test("可用 Firestore ID 清除對應的本機紀錄", () => {
  setUploadedNovels([
    { id: "uploaded-cloud-1", firestoreId: "cloud-1" },
    { id: "uploaded-local-1", firestoreId: null },
  ]);

  deleteUploadedNovel("cloud-1");

  expect(getUploadedNovels()).toEqual([
    { id: "uploaded-local-1", firestoreId: null },
  ]);
});

test("同步時移除雲端已不存在的紀錄並保留未上傳暫存", async () => {
  setUploadedNovels([
    { id: "uploaded-deleted", firestoreId: "deleted-cloud" },
    { id: "uploaded-active", firestoreId: "active-cloud" },
    { id: "uploaded-local", firestoreId: null, isTemp: true },
  ]);
  getUserNovels.mockResolvedValue([
    { id: "active-cloud", title: "仍存在的作品" },
  ]);

  const result = await syncNovelsFromFirestore("user-1");

  expect(result.map((novel) => novel.id)).toEqual([
    "uploaded-active",
    "uploaded-local",
  ]);
  expect(getUploadedNovels()).toEqual(result);
});
