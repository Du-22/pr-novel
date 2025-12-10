import React, { useState } from "react";
import { compressImage } from "../../utils/imageCompressor";

const DEFAULT_COVER = "/images/covers/default-cover.png";

export default function CoverUploadSection({ onCoverChange, onError }) {
  const [coverPreview, setCoverPreview] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);

  // ========== 處理封面上傳 ==========
  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    onError(""); // 清除錯誤
    setIsCompressing(true);

    try {
      // 壓縮圖片
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

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <label className="block text-lg font-semibold text-dark mb-2">
        封面圖片 (選填)
      </label>
      <p className="text-sm text-gray-600 mb-4">如不上傳,系統會使用預設封面</p>

      <input
        type="file"
        accept="image/*"
        onChange={handleCoverUpload}
        disabled={isCompressing}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4
                 file:rounded-lg file:border-0 file:text-sm file:font-semibold
                 file:bg-secondary file:text-dark hover:file:bg-secondary/80
                 file:cursor-pointer cursor-pointer disabled:opacity-50"
      />

      {isCompressing && <div className="mt-4 text-secondary">壓縮中...</div>}

      {/* 封面預覽 */}
      <div className="mt-4">
        <p className="text-sm text-gray-600 mb-2">
          {coverPreview ? "預覽:" : "預設封面預覽:"}
        </p>
        <img
          src={coverPreview || DEFAULT_COVER}
          alt={coverPreview ? "封面預覽" : "預設封面"}
          className="w-48 h-60 object-cover rounded-lg shadow-md"
        />
      </div>
    </div>
  );
}
