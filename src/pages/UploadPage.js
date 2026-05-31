// ============================================
// 檔案名稱: UploadPage.js
// 路徑: src/pages/UploadPage.js
// 用途: 上傳小說頁 — TXT 解析 + 基本資料 + 封面 + 連載狀態
// ============================================

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Info } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
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
import { uploadCoverImage } from "../firebase/storageHelper";
import { uploadChapters } from "../firebase/chapters";
import { compressImage } from "../utils/imageCompressor";

const DEFAULT_COVER = "/images/covers/default-cover.png";

export default function UploadPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [translator, setTranslator] = useState("");
  const [summary, setSummary] = useState("");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState("serializing");

  const [chapters, setChapters] = useState([]);
  const [coverImage, setCoverImage] = useState(null);

  // 分卷模式相關:
  // - volumeMode = 'flat' (預設,單卷上傳,既有書全部走這個)
  // - volumeMode = 'volumed' (分卷上傳,卷 1 內可含序章/終章/番外,日後可繼續加卷 2、卷 3)
  // 建立後不可切換
  const [volumeMode, setVolumeMode] = useState("flat");
  const [volume1Title, setVolume1Title] = useState("卷 1");
  // 卷 1 封面(選填),base64 字串或 null
  const [volume1Cover, setVolume1Cover] = useState(null);
  const [volume1CoverCompressing, setVolume1CoverCompressing] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState("");

  const [storageInfo] = useState(getStorageUsage());

  // 卷 1 封面選檔 — 壓縮後存 base64
  const handleVolume1CoverFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setVolume1CoverCompressing(true);
    try {
      const compressed = await compressImage(file);
      setVolume1Cover(compressed);
    } catch (err) {
      console.error("壓縮失敗:", err);
      setError("卷封面壓縮失敗,請重試");
    } finally {
      setVolume1CoverCompressing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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
      const tagsArray = tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t);

      if (tagsArray.length === 0) {
        setError("請至少輸入一個標籤");
        setIsSubmitting(false);
        return;
      }

      let coverUrl = DEFAULT_COVER;
      if (coverImage && coverImage.startsWith("data:")) {
        coverUrl = await uploadCoverImage(user.uid, coverImage);
      }

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

      // 分卷模式:novelData 加上 volumeMode 與初始 volumes(只有卷 1)
      if (volumeMode === "volumed") {
        // 若使用者上傳了卷 1 封面,先上傳到 Storage 拿 URL
        let v1CoverUrl = null;
        if (volume1Cover && volume1Cover.startsWith("data:")) {
          v1CoverUrl = await uploadCoverImage(user.uid, volume1Cover);
        }
        novelData.volumeMode = "volumed";
        novelData.volumes = [
          {
            volumeNumber: 1,
            title: volume1Title.trim() || "卷 1",
            coverImage: v1CoverUrl, // 沒上傳就是 null
            createdAt: new Date().toISOString(),
          },
        ];
      }

      const savedNovel = saveUploadedNovel(novelData);

      let targetId = savedNovel.id;
      if (user) {
        const firestoreId = await syncUploadToFirestore(savedNovel.id, user.uid);
        if (firestoreId) {
          targetId = firestoreId;
          setUploadProgress({ done: 0, total: chapters.length });
          // 分卷模式上傳時帶 volumeNumber=1(這次是卷 1)
          await uploadChapters(
            firestoreId,
            chapters,
            (done, total) => setUploadProgress({ done, total }),
            volumeMode === "volumed" ? { volumeNumber: 1 } : {}
          );
        }
        await refreshNovels();
      }

      alert("上傳成功!");
      navigate(`/novel/${targetId}`);
    } catch (err) {
      console.error("上傳失敗:", err);
      setError(err.message || "上傳失敗,請稍後再試");
    } finally {
      setIsSubmitting(false);
      setUploadProgress({ done: 0, total: 0 });
    }
  };

  // 未登入提示
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950">
        <Navbar showBackButton={true} />
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-neutral-900 dark:text-neutral-100">
            需要登入才能上傳
          </h1>
          <p className="mb-6 text-neutral-600 dark:text-neutral-400">
            登入後才能上傳小說,並支援跨裝置同步
          </p>
          <Link
            to="/auth"
            className="inline-block px-6 py-3 rounded-lg font-semibold transition-colors
                       bg-primary text-white hover:bg-primary-dark"
          >
            前往登入
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950">
      <Navbar showBackButton={true} />

      <main className="flex-1 container mx-auto px-4 py-8 md:py-12 max-w-4xl">
        {/* ========== 標題 ========== */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2
                         text-neutral-900 dark:text-neutral-100">
            上傳小說
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            上傳後會自動同步至雲端,支援跨裝置閱覽
          </p>
          <div className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            本地暫存已使用: {storageInfo.used}MB / {storageInfo.limit}MB ({storageInfo.percentage}%)
          </div>
        </div>

        {/* ========== 錯誤提示 ========== */}
        {error && (
          <div className="mb-6 p-4 rounded-lg
                          bg-danger-light text-danger
                          dark:bg-danger/15">
            {error}
          </div>
        )}

        {/* ========== 表單 ========== */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 上傳模式選擇 — 建立後不可變更 */}
          <div className="rounded-2xl border p-5 sm:p-6
                          bg-white border-neutral-200
                          dark:bg-neutral-900 dark:border-neutral-800">
            <h2 className="text-lg font-semibold mb-2 text-neutral-900 dark:text-neutral-100">
              上傳模式
            </h2>
            <p className="text-sm mb-4 text-neutral-500 dark:text-neutral-400">
              建立後無法變更。若不確定請選「單卷上傳」。
            </p>

            <div className="inline-flex gap-1 p-1 mb-4 rounded-lg
                            bg-neutral-100 dark:bg-neutral-800">
              <button
                type="button"
                onClick={() => setVolumeMode("flat")}
                className={`px-5 py-2 rounded-md font-medium text-sm transition-all ${
                  volumeMode === "flat"
                    ? "bg-white text-primary shadow-sm dark:bg-neutral-700 dark:text-primary-light"
                    : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                }`}
              >
                單卷上傳
              </button>
              <button
                type="button"
                onClick={() => setVolumeMode("volumed")}
                className={`px-5 py-2 rounded-md font-medium text-sm transition-all ${
                  volumeMode === "volumed"
                    ? "bg-white text-primary shadow-sm dark:bg-neutral-700 dark:text-primary-light"
                    : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                }`}
              >
                分卷上傳
              </button>
            </div>

            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {volumeMode === "flat"
                ? "整本書平鋪顯示。日後新增章節會接在現有章節後面。"
                : "目錄會依卷分組顯示。日後可繼續新增卷 2、卷 3,每卷內可獨立有自己的序章 / 終章 / 番外。"}
            </p>

            {/* 分卷模式才顯示卷 1 名稱欄位 */}
            {volumeMode === "volumed" && (
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-neutral-900 dark:text-neutral-100">
                  卷 1 名稱
                </label>
                <input
                  type="text"
                  value={volume1Title}
                  onChange={(e) => setVolume1Title(e.target.value)}
                  placeholder="例如:卷 1、起始篇、青少年期"
                  className="w-full px-3 py-2 rounded-lg border
                             bg-white text-neutral-900 placeholder-neutral-400 border-neutral-300
                             focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
                             dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500 dark:border-neutral-700"
                />
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  這次上傳的所有章節會放在這一卷裡。事後可以改名稱。
                </p>

                {/* 卷 1 封面(選填)*/}
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-1 text-neutral-900 dark:text-neutral-100">
                    卷 1 封面{" "}
                    <span className="text-xs font-normal text-neutral-400 dark:text-neutral-500">
                      (選填)
                    </span>
                  </label>
                  <p className="mb-2 text-xs text-neutral-500 dark:text-neutral-400">
                    卷封面會顯示在詳情頁該卷分組標題旁。不上傳就只有文字標題。
                  </p>
                  <div className="flex items-center gap-3">
                    {volume1Cover && (
                      <img
                        src={volume1Cover}
                        alt="卷 1 封面預覽"
                        className="w-16 h-20 object-cover rounded border border-neutral-200 dark:border-neutral-700"
                      />
                    )}
                    <label className="inline-flex items-center px-3 py-1.5 rounded-lg border cursor-pointer text-sm font-medium transition-colors
                                      border-neutral-300 text-neutral-700 hover:border-primary hover:text-primary
                                      dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-primary-light dark:hover:text-primary-light">
                      {volume1CoverCompressing
                        ? "處理中..."
                        : volume1Cover
                        ? "更換卷 1 封面"
                        : "選擇卷 1 封面"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleVolume1CoverFile}
                        className="hidden"
                        disabled={volume1CoverCompressing}
                      />
                    </label>
                    {volume1Cover && (
                      <button
                        type="button"
                        onClick={() => setVolume1Cover(null)}
                        className="text-sm text-danger hover:underline"
                      >
                        移除
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* TXT 上傳區 */}
          <TxtUploadSection
            onChaptersChange={setChapters}
            onError={setError}
          />

          {/* 基本資訊 */}
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

          {/* 封面上傳 */}
          <CoverUploadSection
            onCoverChange={setCoverImage}
            onError={setError}
            title={title}
            author={author}
          />

          {/* 提交按鈕 */}
          <div className="flex flex-wrap gap-3 sm:gap-4">
            <button
              type="submit"
              disabled={isSubmitting || chapters.length === 0}
              className="flex-1 min-w-[160px] px-6 py-3 rounded-lg font-semibold transition-colors
                         bg-primary text-white hover:bg-primary-dark
                         disabled:bg-neutral-300 disabled:text-neutral-500 disabled:cursor-not-allowed
                         dark:disabled:bg-neutral-700 dark:disabled:text-neutral-500"
            >
              {isSubmitting
                ? uploadProgress.total > 0
                  ? `上傳章節中 ${uploadProgress.done}/${uploadProgress.total}`
                  : "上傳中..."
                : "上傳小說"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="px-6 py-3 rounded-lg font-semibold transition-colors
                         bg-neutral-100 text-neutral-700 hover:bg-neutral-200
                         dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
            >
              取消
            </button>
          </div>
        </form>

        {/* ========== 使用說明 ========== */}
        <div className="mt-8 p-4 rounded-xl border flex items-start gap-3
                        bg-info-light/40 border-info/20
                        dark:bg-info/10 dark:border-info/30">
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5 text-info" />
          <div className="text-sm text-neutral-700 dark:text-neutral-300">
            <p className="font-semibold mb-1.5 text-neutral-900 dark:text-neutral-100">
              使用說明
            </p>
            <ul className="space-y-1 list-disc list-inside marker:text-info">
              <li>上傳後資料會存在本地並自動同步至 Firebase 雲端</li>
              <li>登入同一帳號可在不同裝置看到你的作品</li>
              <li>TXT 檔案請使用「第X章 章節名稱」格式分章</li>
            </ul>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
