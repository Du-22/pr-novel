import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import TxtUploadSection from "../components/upload/TxtUploadSection";
import CoverUploadSection from "../components/upload/CoverUploadSection";
import BasicInfoForm from "../components/upload/BasicInfoForm";
import {
  saveUploadedNovel,
  getStorageUsage,
  syncUploadToFirestore,
} from "../utils/uploadedNovelsManager";
import { useAuth } from "../hooks/useAuth";
import { refreshNovels } from "../utils/novelsHelper";
import { uploadCoverImage, uploadNovelTxtContent } from "../firebase/storageHelper";
import { updateNovel } from "../firebase/novels";

const DEFAULT_COVER = "/images/covers/default-cover.png";

export default function UploadPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  // 表單狀態
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [translator, setTranslator] = useState("");
  const [summary, setSummary] = useState("");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState("serializing"); // "serializing" | "completed"

  // 檔案狀態
  const [chapters, setChapters] = useState([]);
  const [txtContent, setTxtContent] = useState(null);
  const [coverImage, setCoverImage] = useState(null);

  // 提交狀態
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // 儲存空間資訊
  const [storageInfo] = useState(getStorageUsage());

  // ========== 提交表單 ==========
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 驗證
    if (chapters.length === 0) {
      setError("請上傳 TXT 檔案並確保成功解析");
      return;
    }

    if (!title.trim() || !author.trim() || !summary.trim() || !tags.trim()) {
      setError("請填寫所有必填欄位");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // 準備標籤
      const tagsArray = tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t);

      if (tagsArray.length === 0) {
        setError("請至少輸入一個標籤");
        setIsSubmitting(false);
        return;
      }

      // 封面上傳到 Storage（有自訂封面才上傳）
      let coverUrl = DEFAULT_COVER;
      if (coverImage && coverImage.startsWith("data:")) {
        coverUrl = await uploadCoverImage(user.uid, coverImage);
      }

      // 準備資料
      const novelData = {
        title: title.trim(),
        author: author.trim(),
        translator: translator.trim(),
        summary: summary.trim(),
        tags: tagsArray,
        status,
        coverImage: coverUrl,
        chapters: chapters,
        txtFile: null,
        uploaderName: user?.displayName || user?.email?.split("@")[0] || "",
      };

      // 儲存到 localStorage
      const savedNovel = saveUploadedNovel(novelData);

      // 同步到 Firestore 並取得 Firestore ID
      let targetId = savedNovel.id;
      if (user) {
        const firestoreId = await syncUploadToFirestore(savedNovel.id, user.uid);
        if (firestoreId) {
          targetId = firestoreId;
          // 上傳 TXT 內容到 Storage
          if (txtContent) {
            const txtUrl = await uploadNovelTxtContent(firestoreId, txtContent);
            await updateNovel(firestoreId, { txtUrl }, user.uid);
          }
        }
        await refreshNovels();
      }

      // 提示並跳轉
      alert("上傳成功！");
      navigate(`/novel/${targetId}`);
    } catch (err) {
      console.error("上傳失敗:", err);
      setError("上傳失敗,請稍後再試");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 未登入時顯示提示
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-light">
        <Navbar showBackButton={true} />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-dark mb-4">需要登入才能上傳</h1>
          <p className="text-gray-600 mb-6">
            登入後才能上傳小說，並支援跨裝置同步。
          </p>
          <Link
            to="/auth"
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold"
          >
            前往登入
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light">
      <Navbar showBackButton={true} />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 標題 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-dark mb-2">上傳小說</h1>
          <p className="text-gray-600">
            上傳後會自動同步至雲端，支援跨裝置閱覽
          </p>
          <div className="mt-2 text-sm text-gray-500">
            本地暫存已使用: {storageInfo.used}MB / {storageInfo.limit}MB (
            {storageInfo.percentage}%)
          </div>
        </div>

        {/* 錯誤提示 */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* 表單 */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* TXT 上傳區塊 */}
          <TxtUploadSection
            onChaptersChange={setChapters}
            onTxtContentChange={setTxtContent}
            onError={setError}
          />

          {/* 基本資訊表單 */}
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

          {/* 封面上傳區塊 */}
          <CoverUploadSection
            onCoverChange={setCoverImage}
            onError={setError}
          />

          {/* 提交按鈕 */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSubmitting || chapters.length === 0}
              className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 
                       transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed
                       font-semibold"
            >
              {isSubmitting ? "上傳中..." : "上傳小說"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/")}
              className="px-6 py-3 bg-gray-200 text-dark rounded-lg hover:bg-gray-300 
                       transition-colors font-semibold"
            >
              取消
            </button>
          </div>
        </form>

        {/* 說明文字 */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">使用說明</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• 上傳後資料會存在本地並自動同步至 Firebase 雲端</li>
            <li>• 登入同一帳號可在不同裝置看到你的作品</li>
            <li>• TXT 檔案請使用「第X章 章節名稱」格式分章</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
