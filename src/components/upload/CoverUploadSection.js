// ============================================
// 檔案名稱: CoverUploadSection.js
// 路徑: src/components/upload/CoverUploadSection.js
// 用途: 封面上傳區 — 支援自訂上傳 (壓縮) 或預設漸層封面預覽
//       未上傳時用 DefaultCover 即時預覽 (跟最終呈現一致)
// ============================================

import React, { useState } from "react";
import { compressImage } from "../../utils/imageCompressor";
import DefaultCover from "../DefaultCover";

const DEFAULT_COVER_PATH = "/images/covers/default-cover.png";

export default function CoverUploadSection({
  onCoverChange,
  onError,
  initialCover = null,
  title = "",
  author = "",
}) {
  const [coverPreview, setCoverPreview] = useState(initialCover);
  const [isCompressing, setIsCompressing] = useState(false);

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    onError("");
    setIsCompressing(true);

    try {
      const compressed = await compressImage(file);
      setCoverPreview(compressed);
      onCoverChange(compressed);
    } catch (err) {
      console.error("壓縮失敗:", err);
      onError("圖片壓縮失敗,請重試");
    } finally {
      setIsCompressing(false);
    }
  };

  // 判斷是否該渲染 DefaultCover (沒有自訂封面時)
  const hasCustomCover =
    coverPreview &&
    coverPreview !== DEFAULT_COVER_PATH;

  return (
    <div className="rounded-2xl border p-5 sm:p-6
                    bg-white border-neutral-200
                    dark:bg-neutral-900 dark:border-neutral-800">
      <label className="block text-lg font-semibold mb-2 text-neutral-900 dark:text-neutral-100">
        封面圖片{" "}
        <span className="text-xs font-normal text-neutral-400 dark:text-neutral-500">
          (選填)
        </span>
      </label>
      <p className="mb-4 text-sm text-neutral-600 dark:text-neutral-400">
        如不上傳,系統會根據書名生成漸層封面
      </p>

      <input
        type="file"
        accept="image/*"
        onChange={handleCoverUpload}
        disabled={isCompressing}
        className="block w-full text-sm cursor-pointer
                   text-neutral-500 dark:text-neutral-400
                   file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
                   file:text-sm file:font-semibold file:cursor-pointer
                   file:bg-primary file:text-white hover:file:bg-primary-dark
                   disabled:opacity-50"
      />

      {isCompressing && (
        <div className="mt-4 text-sm text-primary dark:text-primary-light">
          壓縮中...
        </div>
      )}

      {/* 封面預覽 */}
      <div className="mt-4">
        <p className="mb-2 text-sm text-neutral-600 dark:text-neutral-400">
          {hasCustomCover ? "預覽:" : "預設封面預覽 (依書名動態生成):"}
        </p>
        <div className="w-48 aspect-[4/5] overflow-hidden rounded-lg shadow-md
                        bg-neutral-100 dark:bg-neutral-800">
          {hasCustomCover ? (
            <img
              src={coverPreview}
              alt="封面預覽"
              className="w-full h-full object-cover"
            />
          ) : (
            <DefaultCover
              title={title}
              author={author}
              className="w-full h-full"
            />
          )}
        </div>
      </div>
    </div>
  );
}
