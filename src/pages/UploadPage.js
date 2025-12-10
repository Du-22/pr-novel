import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import TxtUploadSection from "../components/upload/TxtUploadSection";
import CoverUploadSection from "../components/upload/CoverUploadSection";
import BasicInfoForm from "../components/upload/BasicInfoForm";
import {
  saveUploadedNovel,
  getStorageUsage,
} from "../utils/uploadedNovelsManager";

const DEFAULT_COVER = "/images/covers/default-cover.png";

export default function UploadPage() {
  const navigate = useNavigate();

  // 表單狀態
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [summary, setSummary] = useState("");
  const [tags, setTags] = useState("");

  // 檔案狀態
  const [chapters, setChapters] = useState([]);
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

      // 準備資料
      const novelData = {
        title: title.trim(),
        author: author.trim(),
        summary: summary.trim(),
        tags: tagsArray,
        coverImage: coverImage || DEFAULT_COVER, // 沒上傳就用預設封面
        chapters: chapters,
        txtFile: null, // localStorage 版本不存檔案路徑
      };

      // 儲存到 localStorage
      const savedNovel = saveUploadedNovel(novelData);

      // 提示並跳轉
      alert("上傳成功!已儲存到本地 (重新整理不會消失)");
      navigate(`/novel/${savedNovel.id}`);
    } catch (err) {
      console.error("上傳失敗:", err);
      setError("上傳失敗,請稍後再試");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-light">
      <Navbar showBackButton={true} />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 標題 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-dark mb-2">上傳小說</h1>
          <p className="text-gray-600">
            目前使用 localStorage 儲存 (約可存 10-15 本小說)
          </p>
          <div className="mt-2 text-sm text-gray-500">
            已使用: {storageInfo.used}MB / {storageInfo.limit}MB (
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
          <TxtUploadSection onChaptersChange={setChapters} onError={setError} />

          {/* 基本資訊表單 */}
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
          <h3 className="font-semibold text-blue-800 mb-2">💡 使用說明</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• 目前使用 localStorage 儲存,重新整理不會消失</li>
            <li>• 大約可儲存 10-15 本小說 (視檔案大小而定)</li>
            <li>• TXT 檔案格式請參考範例小說</li>
            <li>• 未來升級 Firebase 後可無限儲存並跨裝置同步</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
