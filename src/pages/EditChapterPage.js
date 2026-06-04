// ============================================
// 檔案名稱: EditChapterPage.js
// 路徑: src/pages/EditChapterPage.js
// 用途: 編輯單一章節(標題與內文),含未儲存變更離開警告
// ============================================

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getChapter, updateChapter } from "../firebase/chapters";
import { getNovelById } from "../firebase/novels";
import { useAuth } from "../hooks/useAuth";

const INPUT_CLASS =
  "w-full px-3 py-2 rounded-lg border " +
  "bg-white text-neutral-900 placeholder-neutral-400 border-neutral-300 " +
  "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 " +
  "dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500 dark:border-neutral-700";

export default function EditChapterPage() {
  const params = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { id } = params;
  // 支援雙路由:
  //   /my-uploads/edit/:id/chapter/:chapterNumber       (單卷)
  //   /my-uploads/edit/:id/v/:vol/chapter/:ch           (分卷)
  const isVolumed = params.vol !== undefined;
  const volumeNumber = isVolumed ? parseInt(params.vol, 10) : null;
  const chNum = parseInt(isVolumed ? params.ch : params.chapterNumber);

  const [novelTitle, setNovelTitle] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [originalTitle, setOriginalTitle] = useState("");
  const [originalContent, setOriginalContent] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const load = async () => {
      const novel = await getNovelById(id);
      if (!novel) {
        alert("找不到此小說");
        navigate("/profile/works");
        return;
      }
      if (user && novel.authorUid !== user.uid) {
        alert("你沒有編輯此小說的權限");
        navigate("/profile/works");
        return;
      }

      const chapter = await getChapter(id, chNum, volumeNumber);
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
  }, [id, chNum, volumeNumber, user, navigate]);

  useEffect(() => {
    setHasChanges(title !== originalTitle || content !== originalContent);
  }, [title, content, originalTitle, originalContent]);

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
      await updateChapter(
        id,
        chNum,
        {
          title: title.trim(),
          content: content.trim(),
        },
        volumeNumber
      );

      setOriginalTitle(title.trim());
      setOriginalContent(content.trim());
      setHasChanges(false);
      alert("儲存成功!");
      navigate(`/my-uploads/edit/${id}`);
    } catch (err) {
      console.error("儲存失敗:", err);
      setError("儲存失敗,請稍後再試");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges && !window.confirm("你有未儲存的變更,確定要離開嗎?")) return;
    navigate(`/my-uploads/edit/${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
        <Navbar showBackButton={true} />
        <div className="max-w-4xl mx-auto px-4 py-8 text-center text-neutral-500 dark:text-neutral-400">
          載入中...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950">
      <Navbar showBackButton={true} />

      <main className="flex-1 container mx-auto px-4 py-8 md:py-12 max-w-4xl">
        {/* 標題區 */}
        <div className="mb-6">
          <p className="mb-1 text-sm text-neutral-500 dark:text-neutral-400">
            {novelTitle}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight
                         text-neutral-900 dark:text-neutral-100">
            編輯章節
          </h1>
        </div>

        {/* 提示:正在編輯哪一章 */}
        <div className="mb-6 p-4 rounded-lg text-sm font-medium border
                        bg-primary/10 text-primary border-primary/20
                        dark:bg-primary/15 dark:text-primary-light dark:border-primary/30">
          正在編輯:{isVolumed ? `卷 ${volumeNumber}・` : ""}第 {chNum} 章
        </div>

        {error && (
          <div className="mb-4 p-4 rounded-lg text-sm
                          bg-danger-light text-danger
                          dark:bg-danger/15">
            {error}
          </div>
        )}

        <div className="rounded-2xl border p-5 sm:p-6 space-y-5
                        bg-white border-neutral-200
                        dark:bg-neutral-900 dark:border-neutral-800">
          {/* 章節標題 */}
          <div>
            <label className="block text-sm font-medium mb-1 text-neutral-900 dark:text-neutral-100">
              章節標題
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>

          {/* 章節內容 */}
          <div>
            <label className="block text-sm font-medium mb-1 text-neutral-900 dark:text-neutral-100">
              章節內容
              {content && (
                <span className="ml-2 font-normal text-neutral-400 dark:text-neutral-500">
                  {content.length} 字
                </span>
              )}
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={20}
              className={`${INPUT_CLASS} resize-y font-mono`}
            />
          </div>

          {/* 操作按鈕 */}
          <div className="flex gap-3 sm:gap-4 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-6 py-3 rounded-lg font-semibold transition-colors
                         bg-neutral-100 text-neutral-700 hover:bg-neutral-200
                         dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="flex-1 px-6 py-3 rounded-lg font-semibold transition-colors
                         bg-primary text-white hover:bg-primary-dark
                         disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? "儲存中..." : "儲存"}
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
