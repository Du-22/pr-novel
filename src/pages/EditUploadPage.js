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
import AddChapterSection from "../components/upload/AddChapterSection";
import { getNovelById, updateNovel } from "../firebase/novels";
import { useAuth } from "../hooks/useAuth";
import { refreshNovels } from "../utils/novelsHelper";
import { uploadCoverImage } from "../firebase/storageHelper";
import { uploadChapters } from "../firebase/chapters";
import { parseNovelChapters } from "../utils/parser";
import { ref, getBytes } from "firebase/storage";
import { storage } from "../firebase/config";

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
  const [isNewFormat, setIsNewFormat] = useState(false);
  const [hasTxtUrl, setHasTxtUrl] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [migrationError, setMigrationError] = useState("");

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
      setHasTxtUrl(!!novel.txtUrl);
      // 新格式：無 txtUrl 且 chapters 裡沒有 content（子集合架構）
      const chaptersHaveContent = (novel.chapters || []).some((ch) => ch.content);
      setIsNewFormat(!novel.txtUrl && !chaptersHaveContent);
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

  // ========== 舊格式遷移 ==========
  const handleMigrate = async () => {
    setMigrating(true);
    setMigrationError("");
    try {
      let chaptersToMigrate;

      if (hasTxtUrl) {
        // Phase 17 格式：從 Storage 下載並解析
        const storageRef = ref(storage, `novels/${id}/content.txt`);
        const bytes = await getBytes(storageRef);
        const text = new TextDecoder("utf-8").decode(bytes);
        chaptersToMigrate = parseNovelChapters(text);
        if (chaptersToMigrate.length === 0) {
          throw new Error("無法解析章節，請確認 TXT 格式");
        }
      } else {
        // Phase 17 以前：chapters 陣列本身已有內容，直接使用
        chaptersToMigrate = chapters.filter((ch) => ch.content);
        if (chaptersToMigrate.length === 0) {
          throw new Error("找不到可遷移的章節內容");
        }
      }

      // 寫入子集合
      await uploadChapters(id, chaptersToMigrate);

      // 更新小說文件：清除 txtUrl，chapters 只保留 metadata
      const chaptersMetadata = chaptersToMigrate.map(({ chapterNumber, title, wordCount, isSpecial }) => ({
        chapterNumber,
        title,
        wordCount: wordCount || 0,
        isSpecial: isSpecial || false,
      }));
      await updateNovel(id, { txtUrl: null, chapters: chaptersMetadata }, user.uid);

      setChapters(chaptersMetadata);
      setHasTxtUrl(false);
      setIsNewFormat(true);
      await refreshNovels();
    } catch (err) {
      console.error("遷移失敗:", err);
      setMigrationError("遷移失敗：" + err.message);
    } finally {
      setMigrating(false);
    }
  };

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

          <ChapterInfo
            chapters={chapters}
            novelId={id}
            isNewFormat={isNewFormat}
            onChapterDeleted={setChapters}
          />

          {isNewFormat ? (
            <AddChapterSection
              novelId={id}
              existingChapters={chapters}
              onChaptersUpdated={setChapters}
            />
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="font-semibold text-yellow-800 mb-2">此小說使用舊格式</h3>
              <p className="text-sm text-yellow-700 mb-4">
                遷移後可解鎖章節管理功能（新增、編輯、刪除章節）。
                遷移過程會將 Storage 中的 TXT 解析並寫入 Firestore，原始檔案不會被刪除。
              </p>
              {migrationError && (
                <p className="text-sm text-red-600 mb-3">{migrationError}</p>
              )}
              <button
                type="button"
                onClick={handleMigrate}
                disabled={migrating}
                className="px-5 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-60 text-sm font-medium"
              >
                {migrating ? "遷移中..." : "一鍵遷移到新格式"}
              </button>
            </div>
          )}

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
