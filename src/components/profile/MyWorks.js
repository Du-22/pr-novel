// ============================================
// 檔案名稱: MyWorks.js
// 路徑: src/components/profile/MyWorks.js
// 用途: 個人中心「我的作品」Tab — 列出使用者上傳的小說 + 編輯/刪除
// ============================================

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BookMarked } from "lucide-react";
import ConfirmDialog from "../ConfirmDialog";
import DefaultCover from "../DefaultCover";
import { useAuth } from "../../hooks/useAuth";
import { getUserNovels, deleteNovel } from "../../firebase/novels";
import { refreshNovels } from "../../utils/novelsHelper";
import { ProfileListSkeleton } from "../Skeleton";

const DEFAULT_COVER_PATH = "/images/covers/default-cover.png";

export default function MyWorks() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [novels, setNovels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [novelToDelete, setNovelToDelete] = useState(null);
  const [sortOrder, setSortOrder] = useState("newest");

  useEffect(() => {
    if (user) {
      loadWorks();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadWorks = async () => {
    setLoading(true);
    try {
      const data = await getUserNovels(user.uid);
      setNovels(data);
    } catch (error) {
      console.error("載入作品失敗:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (novel) => {
    setNovelToDelete(novel);
    setShowDialog(true);
  };

  const confirmDelete = async () => {
    if (!novelToDelete) return;
    try {
      await deleteNovel(novelToDelete.id, user.uid);
      setNovels(novels.filter((n) => n.id !== novelToDelete.id));
      await refreshNovels();
    } catch (error) {
      console.error("刪除失敗:", error);
      alert("刪除失敗,請稍後再試");
    } finally {
      setShowDialog(false);
      setNovelToDelete(null);
    }
  };

  const getTotalWords = (chapters) => {
    if (!chapters || chapters.length === 0) return 0;
    return chapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0);
  };

  const formatDate = (val) => {
    if (!val) return "";
    try {
      const date = typeof val.toDate === "function" ? val.toDate() : new Date(val);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}/${month}/${day}`;
    } catch {
      return "";
    }
  };

  if (!user) {
    return (
      <div className="p-12 text-center rounded-2xl border
                      bg-white border-neutral-200
                      dark:bg-neutral-900 dark:border-neutral-800">
        <p className="text-neutral-600 dark:text-neutral-400">
          請先登入才能查看我的作品
        </p>
      </div>
    );
  }

  if (loading) return <ProfileListSkeleton count={3} />;

  if (novels.length === 0) {
    return (
      <div className="p-12 text-center rounded-2xl border
                      bg-white border-neutral-200
                      dark:bg-neutral-900 dark:border-neutral-800">
        <BookMarked className="w-12 h-12 mx-auto mb-4 text-neutral-300 dark:text-neutral-700" />
        <h2 className="text-xl font-semibold mb-2 text-neutral-900 dark:text-neutral-100">
          還沒有上傳任何作品
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
    );
  }

  const sortedNovels = [...novels].sort((a, b) => {
    const toDate = (val) => {
      if (!val) return new Date(0);
      if (typeof val.toDate === "function") return val.toDate();
      return new Date(val);
    };
    return sortOrder === "newest"
      ? toDate(b.createdAt) - toDate(a.createdAt)
      : toDate(a.createdAt) - toDate(b.createdAt);
  });

  return (
    <div className="space-y-6">
      {/* 標題列 */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-neutral-600 dark:text-neutral-400">
          共{" "}
          <span className="font-semibold text-primary dark:text-primary-light">
            {novels.length}
          </span>{" "}
          本作品
        </div>
        {/* Sort segmented control */}
        <div className="flex gap-1 p-1 rounded-lg text-sm
                        bg-neutral-100 dark:bg-neutral-800">
          <button
            onClick={() => setSortOrder("newest")}
            className={`px-3 py-1 rounded-md font-semibold transition-all ${
              sortOrder === "newest"
                ? "bg-white text-primary shadow-sm dark:bg-neutral-700 dark:text-primary-light"
                : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
            }`}
          >
            最新
          </button>
          <button
            onClick={() => setSortOrder("oldest")}
            className={`px-3 py-1 rounded-md font-semibold transition-all ${
              sortOrder === "oldest"
                ? "bg-white text-primary shadow-sm dark:bg-neutral-700 dark:text-primary-light"
                : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
            }`}
          >
            最舊
          </button>
        </div>
      </div>

      {/* 作品列表 */}
      <div className="space-y-4">
        {sortedNovels.map((novel) => {
          const isDefaultCover =
            !novel.coverImage || novel.coverImage === DEFAULT_COVER_PATH;
          return (
            <div
              key={novel.id}
              className="p-4 rounded-2xl border transition-all
                         bg-white border-neutral-200 hover:border-neutral-300
                         dark:bg-neutral-900 dark:border-neutral-800 dark:hover:border-neutral-700"
            >
              <div className="flex gap-4">
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

                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-1">
                    <h3 className="flex-1 text-base sm:text-lg font-bold break-words
                                   text-neutral-900 dark:text-neutral-100">
                      {novel.title}
                    </h3>
                    {novel.status && (
                      <span
                        className={`flex-shrink-0 text-[11px] px-1.5 py-0.5 rounded font-medium ${
                          novel.status === "completed"
                            ? "bg-info-light text-info"
                            : "bg-success-light text-success"
                        }`}
                      >
                        {novel.status === "completed" ? "完結" : "連載"}
                      </span>
                    )}
                  </div>
                  <p className="mb-2 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                    作者:{novel.author}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {(novel.tags || []).map((tag, index) => (
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

                  <div className="flex flex-wrap gap-3 sm:gap-4 mb-3 text-xs sm:text-sm
                                  text-neutral-600 dark:text-neutral-400">
                    <div>
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {novel.chapters?.length || 0}
                      </span>{" "}
                      章節
                    </div>
                    <div>
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {getTotalWords(novel.chapters).toLocaleString()}
                      </span>{" "}
                      字
                    </div>
                    <div>
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {novel.stats?.views || 0}
                      </span>{" "}
                      閱讀
                    </div>
                    <div>
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {novel.stats?.favorites || 0}
                      </span>{" "}
                      收藏
                    </div>
                    <div>上傳:{formatDate(novel.createdAt)}</div>
                    <div>
                      最後編輯:
                      {novel.updatedAt ? formatDate(novel.updatedAt) : "尚未編輯"}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    <button
                      onClick={() => navigate(`/novel/${novel.id}`)}
                      className="px-4 py-2 text-sm font-medium rounded-lg transition-colors
                                 bg-neutral-100 text-neutral-700 hover:bg-neutral-200
                                 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
                    >
                      查看詳情
                    </button>
                    <button
                      onClick={() => navigate(`/my-uploads/edit/${novel.id}`)}
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
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

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
