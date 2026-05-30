// ============================================
// 檔案名稱: MyUploadsPage.js
// 路徑: src/pages/MyUploadsPage.js
// 用途: 我的上傳管理頁 — 列出本地+雲端的上傳小說 + 編輯/刪除
// ============================================

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Library } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import DefaultCover from "../components/DefaultCover";
import ConfirmDialog from "../components/ConfirmDialog";
import {
  getUploadedNovels,
  deleteUploadedNovel,
  syncNovelDeleteFromFirestore,
} from "../utils/uploadedNovelsManager";
import { useAuth } from "../hooks/useAuth";
import { refreshNovels } from "../utils/novelsHelper";

const DEFAULT_COVER_PATH = "/images/covers/default-cover.png";

export default function MyUploadsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [novels, setNovels] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [novelToDelete, setNovelToDelete] = useState(null);

  useEffect(() => {
    const uploadedNovels = getUploadedNovels();
    const sorted = uploadedNovels.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    setNovels(sorted);
  }, []);

  const handleDeleteClick = (novel) => {
    setNovelToDelete(novel);
    setShowDialog(true);
  };

  const confirmDelete = async () => {
    if (novelToDelete) {
      deleteUploadedNovel(novelToDelete.id);
      setNovels(novels.filter((n) => n.id !== novelToDelete.id));

      if (novelToDelete.firestoreId && user) {
        await syncNovelDeleteFromFirestore(novelToDelete.firestoreId, user.uid).catch(
          (err) => console.error("Firestore 刪除失敗:", err)
        );
        await refreshNovels();
      }

      setShowDialog(false);
      setNovelToDelete(null);
    }
  };

  // 取得實際可用於 NovelDetailPage / EditUploadPage 查找的 ID
  // 已同步到 Firestore 用 firestoreId, 否則 fallback 本地 id
  const getNavigateId = (novel) => novel.firestoreId || novel.id;

  const handleEdit = (novel) => {
    navigate(`/my-uploads/edit/${getNavigateId(novel)}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}/${month}/${day}`;
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950">
      <Navbar showBackButton={false} />

      <main className="flex-1 container mx-auto px-4 py-8 md:py-12 max-w-6xl">
        {/* 標題區 */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2
                         text-neutral-900 dark:text-neutral-100">
            管理我的上傳
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            共 {novels.length} 本小說
          </p>
        </div>

        {/* 空狀態 */}
        {novels.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border
                          bg-white border-neutral-200
                          dark:bg-neutral-900 dark:border-neutral-800">
            <Library className="w-12 h-12 mx-auto mb-4 text-neutral-300 dark:text-neutral-700" />
            <h2 className="text-xl font-semibold mb-2 text-neutral-900 dark:text-neutral-100">
              還沒有上傳任何小說
            </h2>
            <p className="mb-6 text-neutral-600 dark:text-neutral-400">
              開始上傳你的第一本小說,與大家分享你的創作
            </p>
            <button
              onClick={() => navigate("/upload")}
              className="px-6 py-3 rounded-lg font-semibold transition-colors
                         bg-primary text-white hover:bg-primary-dark"
            >
              立即上傳
            </button>
          </div>
        ) : (
          /* 小說列表 */
          <div className="space-y-4">
            {novels.map((novel) => {
              const isDefaultCover =
                !novel.coverImage || novel.coverImage === DEFAULT_COVER_PATH;
              return (
                <div
                  key={novel.id}
                  className="p-4 rounded-2xl border transition-all
                             bg-white border-neutral-200 hover:border-neutral-300
                             dark:bg-neutral-900 dark:border-neutral-800 dark:hover:border-neutral-700"
                >
                  <div className="flex gap-3 sm:gap-4">
                    {/* 封面縮圖 */}
                    <div className="flex-shrink-0 w-20 h-28 sm:w-24 sm:h-32 overflow-hidden rounded-md
                                    bg-neutral-100 dark:bg-neutral-800">
                      {isDefaultCover ? (
                        <DefaultCover
                          title={novel.title}
                          author={novel.author}
                          className="w-full h-full"
                        />
                      ) : (
                        <img
                          src={novel.coverImage}
                          alt={novel.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>

                    {/* 資訊區 */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-bold mb-1 break-words
                                     text-neutral-900 dark:text-neutral-100">
                        {novel.title}
                      </h3>
                      <p className="mb-2 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                        作者:{novel.author}
                      </p>

                      {/* 標籤 */}
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {novel.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-0.5 text-[11px] rounded-full
                                       bg-neutral-100 text-neutral-700
                                       dark:bg-neutral-800 dark:text-neutral-300"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* 統計資訊 */}
                      <div className="flex flex-wrap gap-3 sm:gap-4 mb-3 text-xs sm:text-sm
                                      text-neutral-600 dark:text-neutral-400">
                        <div>
                          <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                            {novel.chapterCount || 0}
                          </span>{" "}
                          章節
                        </div>
                        <div>
                          <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                            {(novel.totalWordCount || 0).toLocaleString()}
                          </span>{" "}
                          字
                        </div>
                        <div>上傳:{formatDate(novel.createdAt)}</div>
                      </div>

                      {/* 操作按鈕 */}
                      <div className="flex flex-wrap gap-2 sm:gap-3">
                        <button
                          onClick={() => handleEdit(novel)}
                          className="px-4 py-2 text-sm font-medium rounded-lg transition-colors
                                     bg-primary text-white hover:bg-primary-dark"
                        >
                          編輯
                        </button>
                        <button
                          onClick={() => handleDeleteClick(novel)}
                          className="px-4 py-2 text-sm font-medium rounded-lg transition-colors
                                     bg-danger text-white hover:opacity-90"
                        >
                          刪除
                        </button>
                        <button
                          onClick={() => navigate(`/novel/${getNavigateId(novel)}`)}
                          className="px-4 py-2 text-sm font-medium rounded-lg transition-colors
                                     bg-neutral-100 text-neutral-700 hover:bg-neutral-200
                                     dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
                        >
                          查看詳情
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />

      <ConfirmDialog
        isOpen={showDialog}
        title="確認刪除"
        message={
          novelToDelete
            ? `確定要刪除《${novelToDelete.title}》嗎?此操作無法復原。`
            : ""
        }
        confirmText="確定刪除"
        cancelText="取消"
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDialog(false);
          setNovelToDelete(null);
        }}
      />
    </div>
  );
}
