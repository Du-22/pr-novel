// ============================================
// 檔案名稱: EditChapterPage.js
// 路徑: src/pages/EditChapterPage.js
// 用途: 編輯單一章節（標題與內文）
// ============================================
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getChapter, updateChapter } from "../firebase/chapters";
import { getNovelById } from "../firebase/novels";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../hooks/useAuth";

export default function EditChapterPage() {
  const { id, chapterNumber } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const chNum = parseInt(chapterNumber);

  const [novelTitle, setNovelTitle] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [originalTitle, setOriginalTitle] = useState("");
  const [originalContent, setOriginalContent] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  // ========== 載入章節資料 ==========
  useEffect(() => {
    const load = async () => {
      const novel = await getNovelById(id);
      if (!novel) {
        alert("找不到此小說");
        navigate("/profile?tab=works");
        return;
      }
      if (user && novel.authorUid !== user.uid) {
        alert("你沒有編輯此小說的權限");
        navigate("/profile?tab=works");
        return;
      }

      const chapter = await getChapter(id, chNum);
      if (!chapter) {
        alert("找不到此章節");
        navigate(`/my-uploads/edit/${id}`);
        return;
      }

      setNovelTitle(novel.title);
      setTitle(chapter.title);
      setContent(chapter.content || "");
      setOriginalTitle(chapter.title);
      setOriginalContent(chapter.content || "");
      setLoading(false);
    };

    if (user !== undefined) load();
  }, [id, chNum, user, navigate]);

  // ========== 監聽變更 ==========
  useEffect(() => {
    setHasChanges(title !== originalTitle || content !== originalContent);
  }, [title, content, originalTitle, originalContent]);

  // ========== 離開前提醒 ==========
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges]);

  // ========== 儲存 ==========
  const handleSave = async () => {
    if (!title.trim()) {
      setError("章節標題不能為空");
      return;
    }
    if (!content.trim()) {
      setError("章節內容不能為空");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const wordCount = content.trim().length;

      // 更新子集合章節內容
      await updateChapter(id, chNum, {
        title: title.trim(),
        content: content.trim(),
        wordCount,
      });

      // 更新小說文件的 chapters metadata
      const novelRef = doc(db, "novels", id);
      const novelSnap = await getDoc(novelRef);
      if (novelSnap.exists()) {
        const chapters = novelSnap.data().chapters || [];
        const updated = chapters.map((ch) =>
          ch.chapterNumber === chNum
            ? { ...ch, title: title.trim(), wordCount }
            : ch
        );
        await updateDoc(novelRef, { chapters: updated });
      }

      setOriginalTitle(title.trim());
      setOriginalContent(content.trim());
      setHasChanges(false);
      alert("儲存成功！");
      navigate(`/my-uploads/edit/${id}`);
    } catch (err) {
      console.error("儲存失敗:", err);
      setError("儲存失敗，請稍後再試");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges && !window.confirm("你有未儲存的變更，確定要離開嗎？")) return;
    navigate(`/my-uploads/edit/${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-light">
        <Navbar showBackButton={true} />
        <div className="max-w-4xl mx-auto px-4 py-8 text-center text-gray-500">
          載入中...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light">
      <Navbar showBackButton={true} />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 標題區 */}
        <div className="mb-6">
          <p className="text-sm text-gray-500 mb-1">{novelTitle}</p>
          <h1 className="text-2xl font-bold text-dark">編輯章節</h1>
        </div>

        {/* 提示：正在編輯哪一章 */}
        <div className="mb-6 p-4 bg-primary/10 border border-primary/30 rounded-lg text-sm text-primary font-medium">
          正在編輯：第 {chNum} 章
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 space-y-5">
          {/* 章節標題 */}
          <div>
            <label className="block text-sm font-medium text-dark mb-1">章節標題</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* 章節內容 */}
          <div>
            <label className="block text-sm font-medium text-dark mb-1">
              章節內容
              {content && (
                <span className="ml-2 text-gray-400 font-normal">{content.length} 字</span>
              )}
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={20}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y font-mono text-sm"
            />
          </div>

          {/* 操作按鈕 */}
          <div className="flex gap-4 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-6 py-3 bg-gray-200 text-dark rounded-lg hover:bg-gray-300 transition-colors font-semibold"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? "儲存中..." : "儲存"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
