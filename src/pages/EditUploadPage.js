// ============================================
// 檔案名稱: EditUploadPage.js
// 路徑: src/pages/EditUploadPage.js
// 用途: 編輯已上傳小說（從 Firestore 讀取與儲存）
// ============================================
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import BasicInfoForm from "../components/upload/BasicInfoForm";
import CoverUploadSection from "../components/upload/CoverUploadSection";
import ChapterInfo from "../components/upload/ChapterInfo";
import EditNotice from "../components/upload/EditNotice";
import { getNovelById, updateNovel } from "../firebase/novels";
import { useAuth } from "../hooks/useAuth";
import { refreshNovels } from "../utils/novelsHelper";
import { uploadCoverImage } from "../firebase/storageHelper";

export default function EditUploadPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [translator, setTranslator] = useState("");
  const [summary, setSummary] = useState("");
  const [tags, setTags] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [status, setStatus] = useState("serializing"); // "serializing" | "completed"
  const [chapters, setChapters] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalData, setOriginalData] = useState(null);

  // 載入小說資料（從 Firestore）
  useEffect(() => {
    const load = async () => {
      const novel = await getNovelById(id);
      if (!novel) {
        alert("找不到此小說");
        navigate("/profile");
        return;
      }

      // 權限檢查
      if (user && novel.authorUid !== user.uid) {
        alert("你沒有編輯此小說的權限");
        navigate("/profile");
        return;
      }

      const tagsString = (novel.tags || []).join(", ");
      setTitle(novel.title);
      setAuthor(novel.author);
      setTranslator(novel.translator || "");
      setSummary(novel.summary);
      setTags(tagsString);
      setCoverImage(novel.coverImage);
      setStatus(novel.status || "serializing");
      setChapters(novel.chapters || []);
      setOriginalData({ title: novel.title, author: novel.author, translator: novel.translator || "", summary: novel.summary, tags: tagsString, coverImage: novel.coverImage, status: novel.status || "serializing" });
      setLoading(false);
    };

    if (user !== undefined) load();
  }, [id, navigate, user]);

  // 監聽表單變更
  useEffect(() => {
    if (!originalData) return;
    setHasUnsavedChanges(
      title !== originalData.title ||
      author !== originalData.author ||
      translator !== originalData.translator ||
      summary !== originalData.summary ||
      tags !== originalData.tags ||
      coverImage !== originalData.coverImage ||
      status !== originalData.status
    );
  }, [title, author, translator, summary, tags, coverImage, status, originalData]);

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

  const handleSave = async (e) => {
    e.preventDefault();

    if (!title.trim() || !author.trim() || !summary.trim() || !tags.trim()) {
      setError("請填寫所有必填欄位");
      return;
    }

    const tagsArray = tags.split(",").map((t) => t.trim()).filter((t) => t);
    if (tagsArray.length === 0) {
      setError("請至少輸入一個標籤");
      return;
    }

    setSaving(true);
    setError("");

    try {
        // 封面換新的才上傳 Storage
      let finalCoverImage = coverImage;
      if (coverImage && coverImage.startsWith("data:")) {
        finalCoverImage = await uploadCoverImage(user.uid, coverImage);
      }

      const updateData = {
        title: title.trim(),
        author: author.trim(),
        translator: translator.trim(),
        summary: summary.trim(),
        tags: tagsArray,
        coverImage: finalCoverImage,
        status,
      };

      await updateNovel(id, updateData, user.uid);
      await refreshNovels();

      setHasUnsavedChanges(false);
      alert("儲存成功！");
      navigate("/profile?tab=works");
    } catch (err) {
      console.error("儲存失敗:", err);
      setError("儲存失敗，請稍後再試");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      if (!window.confirm("你有未儲存的變更，確定要離開嗎？")) return;
    }
    navigate("/profile?tab=works");
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
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-dark mb-2">編輯小說</h1>
          <p className="text-gray-600">修改小說的基本資料</p>
        </div>

        <div className="mb-6">
          <EditNotice />
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <BasicInfoForm
            title={title}
            author={author}
            translator={translator}
            summary={summary}
            tags={tags}
            onTitleChange={setTitle}
            onAuthorChange={setAuthor}
            onTranslatorChange={setTranslator}
            onSummaryChange={setSummary}
            onTagsChange={setTags}
          />

          {/* 連載狀態 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-dark mb-4">連載狀態</h2>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="serializing"
                  checked={status === "serializing"}
                  onChange={(e) => setStatus(e.target.value)}
                  className="accent-primary"
                />
                <span className="text-dark">連載中</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="completed"
                  checked={status === "completed"}
                  onChange={(e) => setStatus(e.target.value)}
                  className="accent-primary"
                />
                <span className="text-dark">已完結</span>
              </label>
            </div>
          </div>

          <CoverUploadSection
            onCoverChange={setCoverImage}
            onError={setError}
            initialCover={coverImage}
          />

          <ChapterInfo chapters={chapters} />

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
              disabled={saving}
              className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90
                       transition-colors font-semibold disabled:opacity-60"
            >
              {saving ? "儲存中..." : "儲存"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
