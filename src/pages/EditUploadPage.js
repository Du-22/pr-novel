// ============================================
// 檔案名稱: EditUploadPage.js
// 路徑: src/pages/EditUploadPage.js
// 用途: 編輯已上傳小說 — 基本資料 / 封面 / 章節管理 / 舊格式遷移
// ============================================

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
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
  const [status, setStatus] = useState("serializing");
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

  useEffect(() => {
    const load = async () => {
      const novel = await getNovelById(id);
      if (!novel) {
        alert("找不到此小說");
        navigate("/profile");
        return;
      }

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
      const chaptersHaveContent = (novel.chapters || []).some((ch) => ch.content);
      setIsNewFormat(!novel.txtUrl && !chaptersHaveContent);
      setOriginalData({
        title: novel.title,
        author: novel.author,
        translator: novel.translator || "",
        summary: novel.summary,
        tags: tagsString,
        coverImage: novel.coverImage,
        status: novel.status || "serializing",
      });
      setLoading(false);
    };

    if (user !== undefined) load();
  }, [id, navigate, user]);

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

  const handleMigrate = async () => {
    setMigrating(true);
    setMigrationError("");
    try {
      let chaptersToMigrate;

      if (hasTxtUrl) {
        const storageRef = ref(storage, `novels/${id}/content.txt`);
        const bytes = await getBytes(storageRef);
        const text = new TextDecoder("utf-8").decode(bytes);
        chaptersToMigrate = parseNovelChapters(text);
        if (chaptersToMigrate.length === 0) {
          throw new Error("無法解析章節,請確認 TXT 格式");
        }
      } else {
        chaptersToMigrate = chapters.filter((ch) => ch.content);
        if (chaptersToMigrate.length === 0) {
          throw new Error("找不到可遷移的章節內容");
        }
      }

      await uploadChapters(id, chaptersToMigrate);

      const chaptersMetadata = chaptersToMigrate.map(
        ({ chapterNumber, title, wordCount, isSpecial }) => ({
          chapterNumber,
          title,
          wordCount: wordCount || 0,
          isSpecial: isSpecial || false,
        })
      );
      await updateNovel(id, { txtUrl: null, chapters: chaptersMetadata }, user.uid);

      setChapters(chaptersMetadata);
      setHasTxtUrl(false);
      setIsNewFormat(true);
      await refreshNovels();
    } catch (err) {
      console.error("遷移失敗:", err);
      setMigrationError("遷移失敗:" + err.message);
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
      alert("儲存成功!");
      navigate("/profile?tab=works");
    } catch (err) {
      console.error("儲存失敗:", err);
      setError("儲存失敗,請稍後再試");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      if (!window.confirm("你有未儲存的變更,確定要離開嗎?")) return;
    }
    navigate("/profile?tab=works");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
        <Navbar showBackButton={true} />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <p className="text-center text-neutral-500 dark:text-neutral-400">
            載入中...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950">
      <Navbar showBackButton={true} />

      <main className="flex-1 container mx-auto px-4 py-8 md:py-12 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2
                         text-neutral-900 dark:text-neutral-100">
            編輯小說
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            修改小說的基本資料
          </p>
        </div>

        <div className="mb-6">
          <EditNotice />
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg
                          bg-danger-light text-danger
                          dark:bg-danger/15">
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

          {/* 連載狀態 — segmented control */}
          <div className="rounded-2xl border p-5 sm:p-6
                          bg-white border-neutral-200
                          dark:bg-neutral-900 dark:border-neutral-800">
            <h2 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-neutral-100">
              連載狀態
            </h2>
            <div className="inline-flex gap-1 p-1 rounded-lg
                            bg-neutral-100 dark:bg-neutral-800">
              <button
                type="button"
                onClick={() => setStatus("serializing")}
                className={`px-5 py-2 rounded-md font-medium text-sm transition-all ${
                  status === "serializing"
                    ? "bg-white text-primary shadow-sm dark:bg-neutral-700 dark:text-primary-light"
                    : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                }`}
              >
                連載中
              </button>
              <button
                type="button"
                onClick={() => setStatus("completed")}
                className={`px-5 py-2 rounded-md font-medium text-sm transition-all ${
                  status === "completed"
                    ? "bg-white text-primary shadow-sm dark:bg-neutral-700 dark:text-primary-light"
                    : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                }`}
              >
                已完結
              </button>
            </div>
          </div>

          <CoverUploadSection
            onCoverChange={setCoverImage}
            onError={setError}
            initialCover={coverImage}
            title={title}
            author={author}
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
            <div className="rounded-2xl border p-5 sm:p-6
                            bg-warning-light/40 border-warning/30
                            dark:bg-warning/10 dark:border-warning/30">
              <div className="flex items-start gap-3 mb-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-warning" />
                <div>
                  <h3 className="font-semibold mb-1 text-neutral-900 dark:text-neutral-100">
                    此小說使用舊格式
                  </h3>
                  <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                    遷移後可解鎖章節管理功能(新增、編輯、刪除章節)。
                    遷移過程會將 Storage 中的 TXT 解析並寫入 Firestore,原始檔案不會被刪除。
                  </p>
                </div>
              </div>
              {migrationError && (
                <p className="ml-8 mb-3 text-sm text-danger">{migrationError}</p>
              )}
              <button
                type="button"
                onClick={handleMigrate}
                disabled={migrating}
                className="ml-8 px-5 py-2 rounded-lg text-sm font-medium transition-colors
                           bg-warning text-white hover:opacity-90
                           disabled:opacity-60"
              >
                {migrating ? "遷移中..." : "一鍵遷移到新格式"}
              </button>
            </div>
          )}

          <div className="flex gap-3 sm:gap-4">
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
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 rounded-lg font-semibold transition-colors
                         bg-primary text-white hover:bg-primary-dark
                         disabled:opacity-60"
            >
              {saving ? "儲存中..." : "儲存"}
            </button>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}
