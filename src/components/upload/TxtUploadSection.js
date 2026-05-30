// ============================================
// 檔案名稱: TxtUploadSection.js
// 路徑: src/components/upload/TxtUploadSection.js
// 用途: 小說內容輸入區(支援上傳 TXT 檔和直接貼上文字兩種方式)
// ============================================

import React, { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { parseNovelChapters } from "../../utils/parser";
import ChapterPreview from "./ChapterPreview";

export default function TxtUploadSection({ onChaptersChange, onError }) {
  const [activeTab, setActiveTab] = useState("txt");
  const [isParsing, setIsParsing] = useState(false);
  const [chapters, setChapters] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  const [pastedText, setPastedText] = useState("");

  const parseText = (text) => {
    const parsedChapters = parseNovelChapters(text);
    if (parsedChapters.length === 0) {
      onError("無法解析章節,請確認格式(例如:第一章 標題)");
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

  const handleTxtUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!/\.(txt|md)$/i.test(file.name)) {
      onError("請上傳 .txt 或 .md 檔案");
      return;
    }

    setIsParsing(true);
    setChapters([]);
    try {
      const text = await file.text();
      parseText(text);
    } catch (err) {
      console.error("解析失敗:", err);
      onError("檔案解析失敗,請檢查檔案內容");
      onChaptersChange([]);
    } finally {
      setIsParsing(false);
    }
  };

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
    }, 50);
  };

  const getTotalWords = () =>
    chapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0);

  const switchTab = (tab) => {
    setActiveTab(tab);
    setChapters([]);
    setShowPreview(false);
    onChaptersChange([]);
    onError("");
  };

  return (
    <div className="rounded-2xl border p-5 sm:p-6
                    bg-white border-neutral-200
                    dark:bg-neutral-900 dark:border-neutral-800">
      <label className="block text-lg font-semibold mb-4 text-neutral-900 dark:text-neutral-100">
        小說內容 <span className="text-danger">*</span>
      </label>

      {/* Tab 切換 — segmented control */}
      <div className="inline-flex gap-1 p-1 mb-5 rounded-lg
                      bg-neutral-100 dark:bg-neutral-800">
        <button
          type="button"
          onClick={() => switchTab("txt")}
          className={`px-4 py-1.5 rounded-md font-medium text-sm transition-all ${
            activeTab === "txt"
              ? "bg-white text-primary shadow-sm dark:bg-neutral-700 dark:text-primary-light"
              : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
          }`}
        >
          上傳 TXT
        </button>
        <button
          type="button"
          onClick={() => switchTab("manual")}
          className={`px-4 py-1.5 rounded-md font-medium text-sm transition-all ${
            activeTab === "manual"
              ? "bg-white text-primary shadow-sm dark:bg-neutral-700 dark:text-primary-light"
              : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
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
            accept=".txt,.md,text/plain,text/markdown"
            onChange={handleTxtUpload}
            className="block w-full text-sm cursor-pointer
                       text-neutral-500 dark:text-neutral-400
                       file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
                       file:text-sm file:font-semibold file:cursor-pointer
                       file:bg-primary file:text-white hover:file:bg-primary-dark"
          />
          <p className="mt-2 text-xs text-neutral-400 dark:text-neutral-500">
            支援 UTF-8 編碼的 .txt / .md 檔案
          </p>
        </div>
      )}

      {/* 直接輸入 */}
      {activeTab === "manual" && (
        <div>
          <p className="mb-3 text-sm text-neutral-500 dark:text-neutral-400">
            貼上小說全文,系統會自動依「第X章 標題」格式分章。
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
            className="w-full px-3 py-2 text-sm font-mono rounded-lg border resize-y
                       bg-white text-neutral-900 placeholder-neutral-400 border-neutral-300
                       focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
                       dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500 dark:border-neutral-700"
          />
          {pastedText && (
            <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
              {pastedText.length.toLocaleString()} 字元
            </p>
          )}
          <button
            type="button"
            onClick={handleParseText}
            disabled={isParsing || !pastedText.trim()}
            className="mt-3 px-5 py-2 rounded-lg text-sm font-medium transition-colors
                       bg-primary text-white hover:bg-primary-dark
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isParsing ? "解析中..." : "解析章節"}
          </button>
        </div>
      )}

      {/* 解析中 */}
      {isParsing && (
        <div className="mt-4 text-sm text-primary dark:text-primary-light">
          解析中...
        </div>
      )}

      {/* 解析成功 */}
      {chapters.length > 0 && (
        <div className="mt-4 p-4 rounded-lg
                        bg-success-light dark:bg-success/15">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-success" />
              <div>
                <p className="font-semibold text-success">解析成功</p>
                <p className="text-sm mt-0.5 text-success/80 dark:text-success">
                  共 {chapters.length} 章,約 {getTotalWords().toLocaleString()} 字
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="text-sm font-medium transition-colors
                         text-primary hover:text-primary-dark
                         dark:text-primary-light dark:hover:text-primary"
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
