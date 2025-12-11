import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import BasicInfoForm from "../components/upload/BasicInfoForm";
import CoverUploadSection from "../components/upload/CoverUploadSection";
import ChapterInfo from "../components/upload/ChapterInfo";
import EditNotice from "../components/upload/EditNotice";
import {
  getUploadedNovelById,
  updateUploadedNovel,
} from "../utils/uploadedNovelsManager";

export default function EditUploadPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // 表單狀態
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [summary, setSummary] = useState("");
  const [tags, setTags] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [chapters, setChapters] = useState([]);

  // UI 狀態
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalData, setOriginalData] = useState(null);

  // 載入小說資料
  useEffect(() => {
    const novel = getUploadedNovelById(id);

    if (!novel) {
      alert("找不到此小說");
      navigate("/my-uploads");
      return;
    }

    const tagsString = novel.tags.join(", ");
    setTitle(novel.title);
    setAuthor(novel.author);
    setSummary(novel.summary);
    setTags(tagsString);
    setCoverImage(novel.coverImage);
    setChapters(novel.chapters || []);
    setOriginalData({ ...novel, tags: tagsString });
    setLoading(false);
  }, [id, navigate]);

  // 監聽表單變更
  useEffect(() => {
    if (!originalData) return;

    const isChanged =
      title !== originalData.title ||
      author !== originalData.author ||
      summary !== originalData.summary ||
      tags !== originalData.tags ||
      coverImage !== originalData.coverImage;

    setHasUnsavedChanges(isChanged);
  }, [title, author, summary, tags, coverImage, originalData]);

  // 離開前提醒
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // 處理儲存
  const handleSave = (e) => {
    e.preventDefault();

    if (!title.trim() || !author.trim() || !summary.trim() || !tags.trim()) {
      setError("請填寫所有必填欄位");
      return;
    }

    const tagsArray = tags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t);

    if (tagsArray.length === 0) {
      setError("請至少輸入一個標籤");
      return;
    }

    updateUploadedNovel(id, {
      title: title.trim(),
      author: author.trim(),
      summary: summary.trim(),
      tags: tagsArray,
      coverImage: coverImage,
    });

    setError("");
    setHasUnsavedChanges(false);
    alert("儲存成功！");
    navigate("/my-uploads");
  };

  // 處理取消
  const handleCancel = () => {
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm("你有未儲存的變更，確定要離開嗎？");
      if (!confirmLeave) return;
    }
    navigate("/my-uploads");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-light">
        <Navbar showBackButton={true} />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <p className="text-center text-gray-500">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light">
      <Navbar showBackButton={true} />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 標題 */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-dark mb-2">編輯小說</h1>
          <p className="text-gray-600">修改小說的基本資料</p>
        </div>

        {/* 提示訊息 */}
        <div className="mb-6">
          <EditNotice />
        </div>

        {/* 錯誤訊息 */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* 表單 */}
        <form onSubmit={handleSave} className="space-y-6">
          {/* 基本資訊 */}
          <BasicInfoForm
            title={title}
            author={author}
            summary={summary}
            tags={tags}
            onTitleChange={setTitle}
            onAuthorChange={setAuthor}
            onSummaryChange={setSummary}
            onTagsChange={setTags}
          />

          {/* 封面圖片 */}
          <CoverUploadSection
            onCoverChange={setCoverImage}
            onError={setError}
            initialCover={coverImage}
          />

          {/* 章節資訊 */}
          <ChapterInfo chapters={chapters} />

          {/* 按鈕區 */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-6 py-3 bg-gray-200 text-dark rounded-lg hover:bg-gray-300 
                       transition-colors font-semibold"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 
                       transition-colors font-semibold"
            >
              儲存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
