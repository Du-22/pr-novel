// ============================================
// 檔案名稱: TxtUploadSection.js
// 路徑: src/components/upload/TxtUploadSection.js
// 用途: 小說內容輸入區（支援上傳 TXT 檔和直接貼上文字兩種方式）
// ============================================
import React, { useState } from "react";
import { parseNovelChapters } from "../../utils/parser";
import ChapterPreview from "./ChapterPreview";

export default function TxtUploadSection({ onChaptersChange, onError }) {
  const [activeTab, setActiveTab] = useState("txt");
  const [isParsing, setIsParsing] = useState(false);
  const [chapters, setChapters] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  // 直接輸入 tab 狀態
  const [pastedText, setPastedText] = useState("");

  // ========== 解析文字（共用）==========
  const parseText = (text) => {
    const parsedChapters = parseNovelChapters(text);
    if (parsedChapters.length === 0) {
      onError("無法解析章節，請確認格式（例如：第一章 標題）");
      setChapters([]);
      onChaptersChange([]);
      return false;
    }
    setChapters(parsedChapters);
    setShowPreview(true);
    onChaptersChange(parsedChapters);
    onError("");
    return true;
  };

  // ========== TXT 上傳 ==========
  const handleTxtUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.endsWith(".txt")) {
      onError("請上傳 .txt 檔案");
      return;
    }

    setIsParsing(true);
    setChapters([]);
    try {
      const text = await file.text();
      parseText(text);
    } catch (err) {
      console.error("解析失敗:", err);
      onError("檔案解析失敗，請檢查檔案內容");
      onChaptersChange([]);
    } finally {
      setIsParsing(false);
    }
  };

  // ========== 直接輸入解析 ==========
  const handleParseText = () => {
    if (!pastedText.trim()) {
      onError("請輸入小說內容");
      return;
    }
    setIsParsing(true);
    setChapters([]);
    setTimeout(() => {
      parseText(pastedText);
      setIsParsing(false);
    }, 50); // 給 UI 一點時間更新
  };

  // ========== 計算總字數 ==========
  const getTotalWords = () =>
    chapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0);

  // ========== 切換 tab 時清除結果 ==========
  const switchTab = (tab) => {
    setActiveTab(tab);
    setChapters([]);
    setShowPreview(false);
    onChaptersChange([]);
    onError("");
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <label className="block text-lg font-semibold text-dark mb-4">
        小說內容 <span className="text-red-500">*</span>
      </label>

      {/* Tab 切換 */}
      <div className="flex gap-2 mb-5">
        <button
          type="button"
          onClick={() => switchTab("txt")}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            activeTab === "txt"
              ? "bg-primary text-white"
              : "bg-gray-100 text-dark hover:bg-gray-200"
          }`}
        >
          上傳 TXT
        </button>
        <button
          type="button"
          onClick={() => switchTab("manual")}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            activeTab === "manual"
              ? "bg-primary text-white"
              : "bg-gray-100 text-dark hover:bg-gray-200"
          }`}
        >
          直接輸入
        </button>
      </div>

      {/* TXT 上傳 */}
      {activeTab === "txt" && (
        <div>
          <input
            type="file"
            accept=".txt"
            onChange={handleTxtUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4
                     file:rounded-lg file:border-0 file:text-sm file:font-semibold
                     file:bg-primary file:text-white hover:file:bg-primary/90
                     file:cursor-pointer cursor-pointer"
          />
          <p className="mt-2 text-xs text-gray-400">支援 UTF-8 編碼的 .txt 檔案</p>
        </div>
      )}

      {/* 直接輸入 */}
      {activeTab === "manual" && (
        <div>
          <p className="text-sm text-gray-500 mb-3">
            貼上小說全文，系統會自動依「第X章 標題」格式分章。
          </p>
          <textarea
            value={pastedText}
            onChange={(e) => {
              setPastedText(e.target.value);
              setChapters([]);
              setShowPreview(false);
            }}
            placeholder={"第一章 開始\n\n這裡是第一章的內文...\n\n第二章 繼續\n\n這裡是第二章的內文..."}
            rows={14}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y font-mono text-sm"
          />
          {pastedText && (
            <p className="text-xs text-gray-400 mt-1">{pastedText.length.toLocaleString()} 字元</p>
          )}
          <button
            type="button"
            onClick={handleParseText}
            disabled={isParsing || !pastedText.trim()}
            className="mt-3 px-5 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm font-medium"
          >
            {isParsing ? "解析中..." : "解析章節"}
          </button>
        </div>
      )}

      {/* 解析中 */}
      {isParsing && <div className="mt-4 text-primary text-sm">解析中...</div>}

      {/* 解析成功 */}
      {chapters.length > 0 && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-800 font-semibold">解析成功</p>
              <p className="text-sm text-green-600 mt-1">
                共 {chapters.length} 章，約 {getTotalWords().toLocaleString()} 字
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
          {showPreview && <ChapterPreview chapters={chapters} />}
        </div>
      )}
    </div>
  );
}
