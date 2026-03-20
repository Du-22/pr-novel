// ============================================
// 檔案名稱: AddChapterSection.js
// 路徑: src/components/upload/AddChapterSection.js
// 用途: 新增章節元件（支援上傳 TXT 和直接輸入兩種方式）
// ============================================
import React, { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { parseNovelChapters } from "../../utils/parser";
import { uploadChapters, addChapter } from "../../firebase/chapters";

export default function AddChapterSection({ novelId, existingChapters, onChaptersUpdated }) {
  const [activeTab, setActiveTab] = useState("txt");

  // TXT tab 狀態
  const [fileName, setFileName] = useState("");
  const [previewChapters, setPreviewChapters] = useState([]);
  const [txtError, setTxtError] = useState("");

  // 直接輸入 tab 狀態
  const nextNumber = existingChapters.length > 0
    ? Math.max(...existingChapters.map((ch) => ch.chapterNumber)) + 1
    : 1;
  const [manualNumber, setManualNumber] = useState(nextNumber);
  const [manualTitle, setManualTitle] = useState("");
  const [manualContent, setManualContent] = useState("");
  const [manualError, setManualError] = useState("");

  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState("");

  const existingNumbers = new Set(existingChapters.map((ch) => ch.chapterNumber));

  // ========== 合併 metadata 並更新小說文件 ==========
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
    const merged = Object.values(map).sort((a, b) => a.chapterNumber - b.chapterNumber);
    await updateDoc(doc(db, "novels", novelId), { chapters: merged });
    return merged;
  };

  // ========== TXT 上傳 ==========
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
        setTxtError("無法解析章節，請確認 TXT 格式是否正確");
        return;
      }
      const newChapters = parsed.filter((ch) => !existingNumbers.has(ch.chapterNumber));
      if (newChapters.length === 0) {
        setTxtError("TXT 中的章節全部已存在，沒有可新增的章節");
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
      setTxtError("新增失敗，請稍後再試");
    } finally {
      setUploading(false);
    }
  };

  // ========== 直接輸入 ==========
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
      setManualError("新增失敗，請稍後再試");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold text-dark mb-4">新增章節</h2>

      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm">
          {success}
        </div>
      )}

      {/* Tab 切換 */}
      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => { setActiveTab("txt"); setSuccess(""); }}
          className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
            activeTab === "txt"
              ? "bg-primary text-white"
              : "bg-gray-100 text-dark hover:bg-gray-200"
          }`}
        >
          上傳 TXT
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab("manual"); setSuccess(""); }}
          className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
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
          <p className="text-sm text-gray-500 mb-4">
            上傳包含新章節的 TXT 檔案，系統會自動略過已存在的章節。
          </p>

          <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 cursor-pointer hover:border-primary transition-colors">
            <span className="text-gray-500 mb-1">
              {fileName ? fileName : "點擊選擇 TXT 檔案"}
            </span>
            <span className="text-sm text-gray-400">支援 UTF-8 編碼</span>
            <input
              type="file"
              accept=".txt"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>

          {txtError && <p className="mt-2 text-red-600 text-sm">{txtError}</p>}

          {previewChapters.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-dark mb-2">
                偵測到 {previewChapters.length} 個新章節：
              </p>
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                {previewChapters.map((ch) => (
                  <div key={ch.chapterNumber} className="px-4 py-2 flex justify-between text-sm">
                    <span className="text-dark">{ch.title}</span>
                    <span className="text-gray-400">{ch.wordCount} 字</span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={handleConfirmTxt}
                disabled={uploading}
                className="mt-4 w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60 font-medium"
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
          <p className="text-sm text-gray-500">直接輸入單一章節的標題與內容。</p>

          <div className="flex gap-4">
            <div className="w-32">
              <label className="block text-sm font-medium text-dark mb-1">章節編號</label>
              <input
                type="number"
                min="1"
                value={manualNumber}
                onChange={(e) => setManualNumber(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-dark mb-1">章節標題</label>
              <input
                type="text"
                placeholder={`第${manualNumber}章 標題名稱`}
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark mb-1">
              章節內容
              {manualContent && (
                <span className="ml-2 text-gray-400 font-normal">{manualContent.length} 字</span>
              )}
            </label>
            <textarea
              placeholder="在此貼上或輸入章節內容..."
              value={manualContent}
              onChange={(e) => setManualContent(e.target.value)}
              rows={12}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y font-mono text-sm"
            />
          </div>

          {manualError && <p className="text-red-600 text-sm">{manualError}</p>}

          <button
            type="button"
            onClick={handleConfirmManual}
            disabled={uploading}
            className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60 font-medium"
          >
            {uploading ? "新增中..." : "新增章節"}
          </button>
        </div>
      )}
    </div>
  );
}
