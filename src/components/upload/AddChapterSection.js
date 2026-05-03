// ============================================
// 檔案名稱: AddChapterSection.js
// 路徑: src/components/upload/AddChapterSection.js
// 用途: 新增章節元件(支援上傳 TXT 和直接輸入兩種方式)
// ============================================

import React, { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { parseNovelChapters } from "../../utils/parser";
import { uploadChapters, addChapter } from "../../firebase/chapters";

const INPUT_CLASS =
  "w-full px-3 py-2 rounded-lg border " +
  "bg-white text-neutral-900 placeholder-neutral-400 border-neutral-300 " +
  "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 " +
  "dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500 dark:border-neutral-700";

const LABEL_CLASS =
  "block text-sm font-medium mb-1 text-neutral-900 dark:text-neutral-100";

export default function AddChapterSection({
  novelId,
  existingChapters,
  onChaptersUpdated,
}) {
  const [activeTab, setActiveTab] = useState("txt");

  // TXT tab 狀態
  const [fileName, setFileName] = useState("");
  const [previewChapters, setPreviewChapters] = useState([]);
  const [txtError, setTxtError] = useState("");

  // 直接輸入 tab 狀態
  const nextNumber =
    existingChapters.length > 0
      ? Math.max(...existingChapters.map((ch) => ch.chapterNumber)) + 1
      : 1;
  const [manualNumber, setManualNumber] = useState(nextNumber);
  const [manualTitle, setManualTitle] = useState("");
  const [manualContent, setManualContent] = useState("");
  const [manualError, setManualError] = useState("");

  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState("");

  const existingNumbers = new Set(
    existingChapters.map((ch) => ch.chapterNumber)
  );

  const mergeAndUpdate = async (newChapters) => {
    const map = {};
    existingChapters.forEach((ch) => {
      map[ch.chapterNumber] = {
        chapterNumber: ch.chapterNumber,
        title: ch.title,
        wordCount: ch.wordCount || 0,
        isSpecial: ch.isSpecial || false,
      };
    });
    newChapters.forEach((ch) => {
      map[ch.chapterNumber] = {
        chapterNumber: ch.chapterNumber,
        title: ch.title,
        wordCount: ch.wordCount || ch.content?.length || 0,
        isSpecial: ch.isSpecial || false,
      };
    });
    const merged = Object.values(map).sort(
      (a, b) => a.chapterNumber - b.chapterNumber
    );
    await updateDoc(doc(db, "novels", novelId), { chapters: merged });
    return merged;
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".txt")) {
      setTxtError("請選擇 .txt 檔案");
      return;
    }

    setTxtError("");
    setFileName(file.name);
    setPreviewChapters([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const parsed = parseNovelChapters(text);
      if (parsed.length === 0) {
        setTxtError("無法解析章節,請確認 TXT 格式是否正確");
        return;
      }
      const newChapters = parsed.filter(
        (ch) => !existingNumbers.has(ch.chapterNumber)
      );
      if (newChapters.length === 0) {
        setTxtError("TXT 中的章節全部已存在,沒有可新增的章節");
        return;
      }
      setPreviewChapters(newChapters);
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleConfirmTxt = async () => {
    if (previewChapters.length === 0) return;
    setUploading(true);
    setTxtError("");
    try {
      await uploadChapters(novelId, previewChapters);
      const merged = await mergeAndUpdate(previewChapters);
      setPreviewChapters([]);
      setFileName("");
      setSuccess(`成功新增 ${previewChapters.length} 個章節`);
      onChaptersUpdated(merged);
    } catch (err) {
      console.error("新增章節失敗:", err);
      setTxtError("新增失敗,請稍後再試");
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmManual = async () => {
    if (!manualTitle.trim()) {
      setManualError("請輸入章節標題");
      return;
    }
    if (!manualContent.trim()) {
      setManualError("請輸入章節內容");
      return;
    }

    setUploading(true);
    setManualError("");
    try {
      const newChapter = {
        chapterNumber: manualNumber,
        title: manualTitle.trim(),
        content: manualContent.trim(),
        wordCount: manualContent.trim().length,
        isSpecial: false,
      };
      await addChapter(novelId, newChapter);
      const merged = await mergeAndUpdate([newChapter]);
      setManualTitle("");
      setManualContent("");
      setManualNumber(manualNumber + 1);
      setSuccess(`成功新增「${newChapter.title}」`);
      onChaptersUpdated(merged);
    } catch (err) {
      console.error("新增章節失敗:", err);
      setManualError("新增失敗,請稍後再試");
    } finally {
      setUploading(false);
    }
  };

  const tabBtnClass = (key) =>
    `px-4 py-1.5 rounded-md font-medium text-sm transition-all ${
      activeTab === key
        ? "bg-white text-primary shadow-sm dark:bg-neutral-700 dark:text-primary-light"
        : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
    }`;

  return (
    <div className="rounded-2xl border p-5 sm:p-6
                    bg-white border-neutral-200
                    dark:bg-neutral-900 dark:border-neutral-800">
      <h2 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-neutral-100">
        新增章節
      </h2>

      {success && (
        <div className="mb-4 p-3 rounded-lg flex items-start gap-2 text-sm
                        bg-success-light text-success
                        dark:bg-success/15">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {success}
        </div>
      )}

      {/* Tab 切換 — segmented control */}
      <div className="inline-flex gap-1 p-1 mb-6 rounded-lg
                      bg-neutral-100 dark:bg-neutral-800">
        <button
          type="button"
          onClick={() => {
            setActiveTab("txt");
            setSuccess("");
          }}
          className={tabBtnClass("txt")}
        >
          上傳 TXT
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("manual");
            setSuccess("");
          }}
          className={tabBtnClass("manual")}
        >
          直接輸入
        </button>
      </div>

      {/* TXT 上傳 */}
      {activeTab === "txt" && (
        <div>
          <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
            上傳包含新章節的 TXT 檔案,系統會自動略過已存在的章節。
          </p>

          <label className="flex flex-col items-center justify-center p-8 cursor-pointer rounded-lg border-2 border-dashed transition-colors
                            border-neutral-300 hover:border-primary
                            dark:border-neutral-700 dark:hover:border-primary-light">
            <span className="mb-1 text-neutral-700 dark:text-neutral-300">
              {fileName ? fileName : "點擊選擇 TXT 檔案"}
            </span>
            <span className="text-sm text-neutral-400 dark:text-neutral-500">
              支援 UTF-8 編碼
            </span>
            <input
              type="file"
              accept=".txt"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>

          {txtError && (
            <p className="mt-2 text-sm text-danger">{txtError}</p>
          )}

          {previewChapters.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                偵測到 {previewChapters.length} 個新章節:
              </p>
              <div className="border rounded-lg max-h-48 overflow-y-auto divide-y
                              border-neutral-200 divide-neutral-100
                              dark:border-neutral-800 dark:divide-neutral-800">
                {previewChapters.map((ch) => (
                  <div
                    key={ch.chapterNumber}
                    className="flex justify-between gap-3 px-4 py-2 text-sm"
                  >
                    <span className="text-neutral-900 dark:text-neutral-100">
                      {ch.title}
                    </span>
                    <span className="text-neutral-400 dark:text-neutral-500">
                      {ch.wordCount} 字
                    </span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={handleConfirmTxt}
                disabled={uploading}
                className="mt-4 w-full px-4 py-2 rounded-lg font-medium transition-colors
                           bg-primary text-white hover:bg-primary-dark
                           disabled:opacity-60"
              >
                {uploading ? "新增中..." : `確認新增 ${previewChapters.length} 個章節`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 直接輸入 */}
      {activeTab === "manual" && (
        <div className="space-y-4">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            直接輸入單一章節的標題與內容。
          </p>

          <div className="flex gap-3 sm:gap-4">
            <div className="w-32">
              <label className={LABEL_CLASS}>章節編號</label>
              <input
                type="number"
                min="1"
                value={manualNumber}
                onChange={(e) => setManualNumber(parseInt(e.target.value) || 1)}
                className={INPUT_CLASS}
              />
            </div>
            <div className="flex-1">
              <label className={LABEL_CLASS}>章節標題</label>
              <input
                type="text"
                placeholder={`第${manualNumber}章 標題名稱`}
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div>
            <label className={LABEL_CLASS}>
              章節內容
              {manualContent && (
                <span className="ml-2 font-normal text-neutral-400 dark:text-neutral-500">
                  {manualContent.length} 字
                </span>
              )}
            </label>
            <textarea
              placeholder="在此貼上或輸入章節內容..."
              value={manualContent}
              onChange={(e) => setManualContent(e.target.value)}
              rows={12}
              className={`${INPUT_CLASS} resize-y font-mono`}
            />
          </div>

          {manualError && (
            <p className="text-sm text-danger">{manualError}</p>
          )}

          <button
            type="button"
            onClick={handleConfirmManual}
            disabled={uploading}
            className="w-full px-4 py-2 rounded-lg font-medium transition-colors
                       bg-primary text-white hover:bg-primary-dark
                       disabled:opacity-60"
          >
            {uploading ? "新增中..." : "新增章節"}
          </button>
        </div>
      )}
    </div>
  );
}
