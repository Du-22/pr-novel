// ============================================
// 檔案名稱: ChapterInfo.js
// 路徑: src/components/upload/ChapterInfo.js
// 用途: 章節資訊與管理列表（顯示章節數量、支援編輯/刪除）
// ============================================
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { deleteChapter } from "../../firebase/chapters";

export default function ChapterInfo({ chapters, novelId, isNewFormat, onChapterDeleted }) {
  const navigate = useNavigate();
  const [deletingNum, setDeletingNum] = useState(null);

  const getTotalWords = () => {
    if (!chapters || chapters.length === 0) return 0;
    return chapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0);
  };

  const handleDelete = async (chapterNumber, chapterTitle) => {
    if (!window.confirm(`確定要刪除「${chapterTitle}」嗎？此操作無法復原。`)) return;

    setDeletingNum(chapterNumber);
    try {
      // 刪除子集合章節
      await deleteChapter(novelId, chapterNumber);

      // 更新小說文件的 chapters metadata
      const novelRef = doc(db, "novels", novelId);
      const novelSnap = await getDoc(novelRef);
      if (novelSnap.exists()) {
        const updated = (novelSnap.data().chapters || []).filter(
          (ch) => ch.chapterNumber !== chapterNumber
        );
        await updateDoc(novelRef, { chapters: updated });
        if (onChapterDeleted) onChapterDeleted(updated);
      }
    } catch (err) {
      console.error("刪除章節失敗:", err);
      alert("刪除失敗，請稍後再試");
    } finally {
      setDeletingNum(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-dark mb-4">章節管理</h2>

      {/* 統計 */}
      <div className="flex gap-6 mb-4 text-gray-700 text-sm">
        <span>
          共 <span className="font-semibold text-dark">{chapters.length}</span> 章
        </span>
        <span>
          總字數：<span className="font-semibold text-dark">{getTotalWords().toLocaleString()}</span> 字
        </span>
      </div>

      {/* 章節列表（僅新格式顯示操作按鈕） */}
      {chapters.length > 0 && (
        <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-80 overflow-y-auto">
          {chapters.map((ch) => (
            <div key={ch.chapterNumber} className="flex items-center justify-between px-4 py-2 hover:bg-gray-50">
              <div className="flex-1 min-w-0">
                <span className="text-sm text-dark truncate block">{ch.title}</span>
                <span className="text-xs text-gray-400">{(ch.wordCount || 0).toLocaleString()} 字</span>
              </div>
              {isNewFormat && (
                <div className="flex gap-2 ml-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => navigate(`/my-uploads/edit/${novelId}/chapter/${ch.chapterNumber}`)}
                    className="px-3 py-1 text-xs bg-secondary/20 text-primary rounded hover:bg-secondary/40 transition-colors"
                  >
                    編輯
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(ch.chapterNumber, ch.title)}
                    disabled={deletingNum === ch.chapterNumber}
                    className="px-3 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors disabled:opacity-50"
                  >
                    {deletingNum === ch.chapterNumber ? "刪除中" : "刪除"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {chapters.length === 0 && (
        <p className="text-sm text-gray-400">目前沒有章節</p>
      )}
    </div>
  );
}
