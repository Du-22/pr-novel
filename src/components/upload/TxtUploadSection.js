import React, { useState } from "react";
import { parseNovelChapters } from "../../utils/parser";
import ChapterPreview from "./ChapterPreview";

export default function TxtUploadSection({ onChaptersChange, onError }) {
  const [isParsingTxt, setIsParsingTxt] = useState(false);
  const [chapters, setChapters] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  // ========== 處理 TXT 上傳 ==========
  const handleTxtUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 檢查檔案類型
    if (!file.name.endsWith(".txt")) {
      onError("請上傳 .txt 檔案");
      return;
    }

    onError(""); // 清除錯誤
    setIsParsingTxt(true);

    try {
      // 讀取檔案內容
      const text = await file.text();

      // 解析章節
      const parsedChapters = parseNovelChapters(text);

      if (parsedChapters.length === 0) {
        onError("無法解析章節,請檢查檔案格式");
        setChapters([]);
        onChaptersChange([]);
      } else {
        setChapters(parsedChapters);
        setShowPreview(true);
        onChaptersChange(parsedChapters);
      }
    } catch (err) {
      console.error("解析失敗:", err);
      onError("檔案解析失敗,請檢查檔案內容");
      setChapters([]);
      onChaptersChange([]);
    } finally {
      setIsParsingTxt(false);
    }
  };

  // ========== 計算總字數 ==========
  const getTotalWords = () => {
    return chapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <label className="block text-lg font-semibold text-dark mb-2">
        小說檔案 (TXT) <span className="text-red-500">*</span>
      </label>

      <input
        type="file"
        accept=".txt"
        onChange={handleTxtUpload}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4
                 file:rounded-lg file:border-0 file:text-sm file:font-semibold
                 file:bg-primary file:text-white hover:file:bg-primary/90
                 file:cursor-pointer cursor-pointer"
      />

      {/* 解析中提示 */}
      {isParsingTxt && <div className="mt-4 text-primary">解析中...</div>}

      {/* 解析成功提示 */}
      {chapters.length > 0 && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-800 font-semibold">✓ 解析成功!</p>
              <p className="text-sm text-green-600 mt-1">
                共 {chapters.length} 章,約 {getTotalWords().toLocaleString()} 字
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="text-sm text-primary hover:underline"
            >
              {showPreview ? "隱藏" : "查看"}章節列表
            </button>
          </div>

          {/* 章節預覽 */}
          {showPreview && <ChapterPreview chapters={chapters} />}
        </div>
      )}
    </div>
  );
}
