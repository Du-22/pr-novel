// ============================================
// 檔案名稱: MyWorks.js
// 路徑: src/components/profile/MyWorks.js
// 用途: 個人中心「我的作品」Tab（從 Firestore 讀取）
// ============================================
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmDialog from "../ConfirmDialog";
import { useAuth } from "../../hooks/useAuth";
import { getUserNovels, deleteNovel } from "../../firebase/novels";
import { refreshNovels } from "../../utils/novelsHelper";

export default function MyWorks() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [novels, setNovels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [novelToDelete, setNovelToDelete] = useState(null);
  const [sortOrder, setSortOrder] = useState("newest"); // "newest" | "oldest"

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
      alert("刪除失敗，請稍後再試");
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
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <p className="text-gray-600">請先登入才能查看我的作品</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <p className="text-gray-500">載入中...</p>
      </div>
    );
  }

  if (novels.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <div className="text-6xl mb-4">📝</div>
        <h2 className="text-xl font-semibold text-dark mb-2">
          還沒有上傳任何作品
        </h2>
        <p className="text-gray-600 mb-6">
          開始上傳你的第一本小說，與大家分享你的創作！
        </p>
        <button
          onClick={() => navigate("/upload")}
          className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90
                   transition-colors font-semibold"
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
      <div className="flex items-center justify-between">
        <div className="text-gray-600">
          共 <span className="font-semibold text-primary">{novels.length}</span>{" "}
          本作品
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 text-sm">
          <button
            onClick={() => setSortOrder("newest")}
            className={`px-3 py-1 rounded-md transition-colors ${
              sortOrder === "newest"
                ? "bg-white text-primary shadow-sm font-semibold"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            最新
          </button>
          <button
            onClick={() => setSortOrder("oldest")}
            className={`px-3 py-1 rounded-md transition-colors ${
              sortOrder === "oldest"
                ? "bg-white text-primary shadow-sm font-semibold"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            最舊
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {sortedNovels.map((novel) => (
          <div
            key={novel.id}
            className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
          >
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-24 h-32 overflow-hidden rounded-md bg-gray-200">
                <img
                  src={novel.coverImage}
                  alt={novel.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 mb-1">
                  <h3 className="text-lg font-bold text-dark break-words flex-1">
                    {novel.title}
                  </h3>
                  {novel.status && (
                    <span className={`flex-shrink-0 text-xs px-1.5 py-0.5 rounded font-medium ${
                      novel.status === "completed"
                        ? "bg-blue-50 text-blue-600"
                        : "bg-green-50 text-green-600"
                    }`}>
                      {novel.status === "completed" ? "完結" : "連載"}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mb-2">
                  作者：{novel.author}
                </p>

                <div className="flex flex-wrap gap-2 mb-2">
                  {(novel.tags || []).map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-0.5 text-xs rounded-full bg-light text-primary
                               border border-primary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                  <div>
                    <span className="font-semibold text-dark">
                      {novel.chapters?.length || 0}
                    </span>{" "}
                    章節
                  </div>
                  <div>
                    <span className="font-semibold text-dark">
                      {getTotalWords(novel.chapters).toLocaleString()}
                    </span>{" "}
                    字
                  </div>
                  <div>
                    <span className="font-semibold text-dark">
                      {novel.stats?.views || 0}
                    </span>{" "}
                    閱讀
                  </div>
                  <div>
                    <span className="font-semibold text-dark">
                      {novel.stats?.favorites || 0}
                    </span>{" "}
                    收藏
                  </div>
                  <div>上傳日期：{formatDate(novel.createdAt)}</div>
                  <div>
                    最後編輯：
                    {novel.updatedAt ? formatDate(novel.updatedAt) : "尚未編輯"}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => navigate(`/novel/${novel.id}`)}
                    className="px-4 py-2 bg-gray-200 text-dark rounded-lg hover:bg-gray-300
                             transition-colors text-sm font-medium"
                  >
                    查看詳情
                  </button>
                  <button
                    onClick={() => navigate(`/my-uploads/edit/${novel.id}`)}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90
                             transition-colors text-sm font-medium"
                  >
                    編輯
                  </button>
                  <button
                    onClick={() => handleDeleteClick(novel)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600
                             transition-colors text-sm font-medium"
                  >
                    刪除
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        isOpen={showDialog}
        title="確認刪除"
        message={
          novelToDelete
            ? `確定要刪除《${novelToDelete.title}》嗎？此操作無法復原。`
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
