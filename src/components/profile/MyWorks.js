import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmDialog from "../ConfirmDialog";
import {
  getUploadedNovels,
  deleteUploadedNovel,
} from "../../utils/uploadedNovelsManager";

export default function MyWorks() {
  const navigate = useNavigate();
  const [novels, setNovels] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [novelToDelete, setNovelToDelete] = useState(null);

  // 載入上傳的小說列表
  useEffect(() => {
    const uploadedNovels = getUploadedNovels();
    // 按上傳日期排序（最新在前）
    const sorted = uploadedNovels.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    setNovels(sorted);
  }, []);

  // 處理刪除
  const handleDeleteClick = (novel) => {
    setNovelToDelete(novel);
    setShowDialog(true);
  };

  const confirmDelete = () => {
    if (novelToDelete) {
      deleteUploadedNovel(novelToDelete.id);
      setNovels(novels.filter((n) => n.id !== novelToDelete.id));
      setShowDialog(false);
      setNovelToDelete(null);
    }
  };

  // 處理編輯
  const handleEdit = (novelId) => {
    navigate(`/my-uploads/edit/${novelId}`);
  };

  // 計算總字數
  const getTotalWords = (chapters) => {
    if (!chapters || chapters.length === 0) return 0;
    return chapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0);
  };

  // 格式化日期
  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}/${month}/${day}`;
    } catch (error) {
      return dateString;
    }
  };

  // 空狀態
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

  return (
    <div className="space-y-6">
      {/* 作品數量提示 */}
      <div className="text-gray-600">
        共 <span className="font-semibold text-primary">{novels.length}</span>{" "}
        本作品
      </div>

      {/* 小說列表 */}
      <div className="space-y-4">
        {novels.map((novel) => (
          <div
            key={novel.id}
            className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
          >
            <div className="flex gap-4">
              {/* 封面縮圖 */}
              <div className="flex-shrink-0 w-24 h-32 overflow-hidden rounded-md bg-gray-200">
                <img
                  src={novel.coverImage}
                  alt={novel.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* 資訊區 */}
              <div className="flex-1 min-w-0">
                {/* 標題 + 作者 */}
                <h3 className="text-lg font-bold text-dark mb-1 break-words">
                  {novel.title}
                </h3>
                <p className="text-sm text-gray-500 mb-2">
                  作者：{novel.author}
                </p>

                {/* 標籤 */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {novel.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-0.5 text-xs rounded-full bg-light text-primary 
                               border border-primary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* 統計資訊 */}
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
                </div>

                {/* 操作按鈕 */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleEdit(novel.id)}
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
                  <button
                    onClick={() => navigate(`/novel/${novel.id}`)}
                    className="px-4 py-2 bg-gray-200 text-dark rounded-lg hover:bg-gray-300 
                             transition-colors text-sm font-medium"
                  >
                    查看詳情
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 刪除確認對話框 */}
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
