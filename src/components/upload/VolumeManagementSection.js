// ============================================
// 檔案名稱: VolumeManagementSection.js
// 路徑: src/components/upload/VolumeManagementSection.js
// 用途: 分卷小說的卷管理區塊 — 列出每卷(改名 / 改封面 / 刪除),
//       底部「新增卷 N+1」表單(輸入卷名 + 卷封面 + TXT 章節檔)
//       單卷小說不使用這個元件
// ============================================

import React, { useState, useMemo } from "react";
import { CheckCircle2, Trash2, Image as ImageIcon } from "lucide-react";
import { parseNovelChapters } from "../../utils/parser";
import {
  uploadChapters,
  deleteChapter,
} from "../../firebase/chapters";
import { updateNovel } from "../../firebase/novels";
import { uploadCoverImage } from "../../firebase/storageHelper";
import { compressImage } from "../../utils/imageCompressor";
import { formatChapterLabelText } from "../../utils/chapterLabel";

const INPUT_CLASS =
  "w-full px-3 py-2 rounded-lg border " +
  "bg-white text-neutral-900 placeholder-neutral-400 border-neutral-300 " +
  "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 " +
  "dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500 dark:border-neutral-700";

export default function VolumeManagementSection({
  novelId,
  userId,
  volumes,
  chapters,
  onVolumesUpdated, // (newVolumes) => void
  onChaptersUpdated, // (newChapters) => void
}) {
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // 編輯中的卷:vol number → { title?, coverFile? base64 }
  const [editing, setEditing] = useState({});

  // 新增卷表單 state
  const [showAddForm, setShowAddForm] = useState(false);
  const nextVolumeNumber = useMemo(
    () => (volumes.length === 0 ? 1 : Math.max(...volumes.map((v) => v.volumeNumber)) + 1),
    [volumes]
  );
  const [newVolTitle, setNewVolTitle] = useState(`卷 ${nextVolumeNumber}`);
  const [newVolCover, setNewVolCover] = useState(null);
  const [newVolCoverCompressing, setNewVolCoverCompressing] = useState(false);
  const [newVolFileName, setNewVolFileName] = useState("");
  const [newVolPreviewChapters, setNewVolPreviewChapters] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });

  // ============== Helper ==============

  const chaptersByVolume = useMemo(() => {
    const map = new Map();
    chapters.forEach((ch) => {
      const v = ch.volumeNumber ?? null;
      if (v == null) return;
      if (!map.has(v)) map.set(v, []);
      map.get(v).push(ch);
    });
    return map;
  }, [chapters]);

  const lastVolumeNumber = useMemo(
    () => (volumes.length === 0 ? null : Math.max(...volumes.map((v) => v.volumeNumber))),
    [volumes]
  );

  const compressFileToBase64 = async (file) => {
    setError("");
    return await compressImage(file);
  };

  // ============== 改卷名 / 改封面 ==============

  const handleStartEditTitle = (vol) => {
    setEditing((prev) => ({
      ...prev,
      [vol.volumeNumber]: {
        ...prev[vol.volumeNumber],
        title: vol.title,
      },
    }));
  };

  const handleEditTitleChange = (volNum, newTitle) => {
    setEditing((prev) => ({
      ...prev,
      [volNum]: { ...prev[volNum], title: newTitle },
    }));
  };

  const handleEditCoverFile = async (volNum, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressFileToBase64(file);
      setEditing((prev) => ({
        ...prev,
        [volNum]: { ...prev[volNum], coverFile: compressed },
      }));
    } catch (err) {
      console.error("壓縮失敗:", err);
      setError("卷封面壓縮失敗,請重試");
    }
  };

  const handleSaveVolumeEdit = async (volNum) => {
    const draft = editing[volNum];
    if (!draft) return;
    setBusy(true);
    setError("");
    setSuccess("");

    try {
      let newCoverUrl = null;
      if (draft.coverFile && draft.coverFile.startsWith("data:")) {
        newCoverUrl = await uploadCoverImage(userId, draft.coverFile);
      }

      const newVolumes = volumes.map((v) => {
        if (v.volumeNumber !== volNum) return v;
        return {
          ...v,
          ...(draft.title != null ? { title: draft.title.trim() || v.title } : {}),
          ...(newCoverUrl ? { coverImage: newCoverUrl } : {}),
        };
      });

      await updateNovel(novelId, { volumes: newVolumes }, userId);
      onVolumesUpdated(newVolumes);
      setEditing((prev) => {
        const next = { ...prev };
        delete next[volNum];
        return next;
      });
      setSuccess(`卷 ${volNum} 已更新`);
    } catch (err) {
      console.error("更新卷失敗:", err);
      setError(err.message || "更新失敗,請稍後再試");
    } finally {
      setBusy(false);
    }
  };

  const handleCancelEdit = (volNum) => {
    setEditing((prev) => {
      const next = { ...prev };
      delete next[volNum];
      return next;
    });
  };

  // ============== 刪除卷 (只能刪最後一卷) ==============

  const handleDeleteVolume = async (vol) => {
    if (vol.volumeNumber !== lastVolumeNumber) {
      alert("只能刪除最後一卷。如需刪除中間的卷,請聯絡管理員。");
      return;
    }
    const chsInVol = chaptersByVolume.get(vol.volumeNumber) || [];
    if (
      !window.confirm(
        `確定要刪除「${vol.title}」嗎?\n` +
          `這會連同卷內 ${chsInVol.length} 個章節一起刪除,此操作無法復原。`
      )
    ) {
      return;
    }

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      // 1. 刪該卷的所有章節 (Storage + Firestore doc + 主 doc 字數彙總會被 decrement)
      for (const ch of chsInVol) {
        await deleteChapter(novelId, ch.chapterNumber, vol.volumeNumber);
      }
      // 2. 從 novel.volumes 移除這卷
      const newVolumes = volumes.filter((v) => v.volumeNumber !== vol.volumeNumber);
      await updateNovel(novelId, { volumes: newVolumes }, userId);

      // 3. 通知父層
      onVolumesUpdated(newVolumes);
      onChaptersUpdated(
        chapters.filter((ch) => ch.volumeNumber !== vol.volumeNumber)
      );
      setSuccess(`卷 ${vol.volumeNumber} 已刪除`);
    } catch (err) {
      console.error("刪除卷失敗:", err);
      setError(err.message || "刪除失敗,請稍後再試");
    } finally {
      setBusy(false);
    }
  };

  // ============== 新增卷 ==============

  const handleNewVolCoverFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setNewVolCoverCompressing(true);
    try {
      const compressed = await compressFileToBase64(file);
      setNewVolCover(compressed);
    } catch (err) {
      console.error("壓縮失敗:", err);
      setError("卷封面壓縮失敗,請重試");
    } finally {
      setNewVolCoverCompressing(false);
    }
  };

  const handleNewVolFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/\.(txt|md)$/i.test(file.name)) {
      setError("請選擇 .txt 或 .md 檔案");
      return;
    }
    setError("");
    setNewVolFileName(file.name);
    setNewVolPreviewChapters([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const parsed = parseNovelChapters(text);
      if (parsed.length === 0) {
        setError("無法解析章節,請確認 TXT 格式是否正確");
        return;
      }
      setNewVolPreviewChapters(parsed);
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleConfirmAddVolume = async () => {
    if (newVolPreviewChapters.length === 0) {
      setError("請先選擇含章節的 TXT");
      return;
    }
    if (!newVolTitle.trim()) {
      setError("請輸入卷名稱");
      return;
    }

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      // 1. 卷封面(若有)先上傳到 Storage
      let coverUrl = null;
      if (newVolCover && newVolCover.startsWith("data:")) {
        coverUrl = await uploadCoverImage(userId, newVolCover);
      }

      // 2. 上傳卷內章節
      setUploadProgress({ done: 0, total: newVolPreviewChapters.length });
      await uploadChapters(
        novelId,
        newVolPreviewChapters,
        (done, total) => setUploadProgress({ done, total }),
        { volumeNumber: nextVolumeNumber }
      );

      // 3. 把新卷塞進 novel.volumes
      const newVolumes = [
        ...volumes,
        {
          volumeNumber: nextVolumeNumber,
          title: newVolTitle.trim(),
          coverImage: coverUrl,
          createdAt: new Date().toISOString(),
        },
      ];
      await updateNovel(novelId, { volumes: newVolumes }, userId);

      // 4. 把新章節合到本地 chapters state
      const newChapters = newVolPreviewChapters.map((ch) => ({
        chapterNumber: ch.chapterNumber,
        title: ch.title,
        wordCount: ch.wordCount || ch.content?.length || 0,
        isSpecial: ch.isSpecial || false,
        label: ch.label || null,
        volumeNumber: nextVolumeNumber,
      }));
      onVolumesUpdated(newVolumes);
      onChaptersUpdated([...chapters, ...newChapters]);

      // 5. Reset form
      setShowAddForm(false);
      setNewVolTitle(`卷 ${nextVolumeNumber + 1}`);
      setNewVolCover(null);
      setNewVolFileName("");
      setNewVolPreviewChapters([]);
      setSuccess(`成功新增「${newVolTitle.trim()}」`);
    } catch (err) {
      console.error("新增卷失敗:", err);
      setError(err.message || "新增失敗,請稍後再試");
    } finally {
      setBusy(false);
      setUploadProgress({ done: 0, total: 0 });
    }
  };

  // ============== Render ==============

  return (
    <div className="rounded-2xl border p-5 sm:p-6
                    bg-white border-neutral-200
                    dark:bg-neutral-900 dark:border-neutral-800">
      <h2 className="text-lg font-semibold mb-2 text-neutral-900 dark:text-neutral-100">
        卷管理
      </h2>
      <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
        每卷可獨立改名稱、改封面。新增卷會把這個檔案的章節掛在新卷下。
      </p>

      {success && (
        <div className="mb-4 p-3 rounded-lg flex items-start gap-2 text-sm
                        bg-success-light text-success
                        dark:bg-success/15">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 rounded-lg text-sm
                        bg-danger-light text-danger
                        dark:bg-danger/15">
          {error}
        </div>
      )}

      {/* 既有卷清單 */}
      <div className="space-y-3 mb-4">
        {volumes
          .slice()
          .sort((a, b) => a.volumeNumber - b.volumeNumber)
          .map((vol) => {
            const inVolCount = (chaptersByVolume.get(vol.volumeNumber) || []).length;
            const isEditing = !!editing[vol.volumeNumber];
            const draft = editing[vol.volumeNumber] || {};
            const isLast = vol.volumeNumber === lastVolumeNumber;
            const previewCover = draft.coverFile || vol.coverImage;
            return (
              <div
                key={vol.volumeNumber}
                className="p-4 rounded-lg border
                           border-neutral-200 dark:border-neutral-800"
              >
                <div className="flex items-start gap-3">
                  {/* 封面 thumbnail */}
                  <div className="flex-shrink-0">
                    {previewCover ? (
                      <img
                        src={previewCover}
                        alt={vol.title}
                        className="w-16 h-20 object-cover rounded
                                   border border-neutral-200 dark:border-neutral-700"
                      />
                    ) : (
                      <div className="w-16 h-20 rounded flex items-center justify-center
                                      bg-neutral-100 text-neutral-400
                                      dark:bg-neutral-800 dark:text-neutral-500">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                    )}
                  </div>

                  {/* 卷資訊區 */}
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <input
                        type="text"
                        value={draft.title ?? vol.title}
                        onChange={(e) =>
                          handleEditTitleChange(vol.volumeNumber, e.target.value)
                        }
                        className={INPUT_CLASS}
                      />
                    ) : (
                      <div className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                        {vol.title}
                      </div>
                    )}
                    <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                      卷 {vol.volumeNumber}・{inVolCount} 章
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {isEditing ? (
                        <>
                          <label className="inline-flex items-center px-3 py-1 rounded cursor-pointer text-xs font-medium
                                            border border-neutral-300 text-neutral-700 hover:border-primary hover:text-primary
                                            dark:border-neutral-700 dark:text-neutral-300
                                            dark:hover:border-primary-light dark:hover:text-primary-light">
                            {draft.coverFile ? "更換封面" : "選擇新封面"}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleEditCoverFile(vol.volumeNumber, e)}
                              className="hidden"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => handleSaveVolumeEdit(vol.volumeNumber)}
                            disabled={busy}
                            className="px-3 py-1 text-xs rounded font-medium transition-colors
                                       bg-primary text-white hover:bg-primary-dark
                                       disabled:opacity-60"
                          >
                            儲存
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCancelEdit(vol.volumeNumber)}
                            disabled={busy}
                            className="px-3 py-1 text-xs rounded font-medium transition-colors
                                       bg-neutral-100 text-neutral-700 hover:bg-neutral-200
                                       dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
                          >
                            取消
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleStartEditTitle(vol)}
                            disabled={busy}
                            className="px-3 py-1 text-xs rounded font-medium transition-colors
                                       bg-primary/10 text-primary hover:bg-primary/20
                                       dark:bg-primary/20 dark:text-primary-light dark:hover:bg-primary/30"
                          >
                            編輯
                          </button>
                          {isLast && volumes.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteVolume(vol)}
                              disabled={busy}
                              className="inline-flex items-center gap-1 px-3 py-1 text-xs rounded font-medium transition-colors
                                         bg-danger-light text-danger hover:opacity-80
                                         dark:bg-danger/15 dark:text-danger
                                         disabled:opacity-50"
                            >
                              <Trash2 className="w-3 h-3" />
                              刪除最後一卷
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* 新增卷區 */}
      {!showAddForm ? (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          disabled={busy}
          className="w-full px-4 py-2 rounded-lg border-2 border-dashed font-medium transition-colors
                     border-neutral-300 text-neutral-700 hover:border-primary hover:text-primary
                     dark:border-neutral-700 dark:text-neutral-300
                     dark:hover:border-primary-light dark:hover:text-primary-light
                     disabled:opacity-50"
        >
          + 新增卷 {nextVolumeNumber}
        </button>
      ) : (
        <div className="p-4 rounded-lg border border-primary/30
                        bg-primary/[0.03] dark:bg-primary/[0.07] dark:border-primary-light/30 space-y-4">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            新增卷 {nextVolumeNumber}
          </h3>

          {/* 卷名 */}
          <div>
            <label className="block text-sm font-medium mb-1 text-neutral-900 dark:text-neutral-100">
              卷 {nextVolumeNumber} 名稱
            </label>
            <input
              type="text"
              value={newVolTitle}
              onChange={(e) => setNewVolTitle(e.target.value)}
              placeholder={`卷 ${nextVolumeNumber}`}
              className={INPUT_CLASS}
            />
          </div>

          {/* 卷封面(選填)*/}
          <div>
            <label className="block text-sm font-medium mb-1 text-neutral-900 dark:text-neutral-100">
              卷封面{" "}
              <span className="text-xs font-normal text-neutral-400 dark:text-neutral-500">
                (選填)
              </span>
            </label>
            <div className="flex items-center gap-3">
              {newVolCover && (
                <img
                  src={newVolCover}
                  alt={`卷 ${nextVolumeNumber} 封面預覽`}
                  className="w-16 h-20 object-cover rounded border border-neutral-200 dark:border-neutral-700"
                />
              )}
              <label className="inline-flex items-center px-3 py-1.5 rounded-lg border cursor-pointer text-sm font-medium transition-colors
                                border-neutral-300 text-neutral-700 hover:border-primary hover:text-primary
                                dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-primary-light dark:hover:text-primary-light">
                {newVolCoverCompressing
                  ? "處理中..."
                  : newVolCover
                  ? "更換卷封面"
                  : "選擇卷封面"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleNewVolCoverFile}
                  className="hidden"
                  disabled={newVolCoverCompressing}
                />
              </label>
              {newVolCover && (
                <button
                  type="button"
                  onClick={() => setNewVolCover(null)}
                  className="text-sm text-danger hover:underline"
                >
                  移除
                </button>
              )}
            </div>
          </div>

          {/* TXT 上傳 */}
          <div>
            <label className="block text-sm font-medium mb-1 text-neutral-900 dark:text-neutral-100">
              章節 TXT
            </label>
            <label className="flex flex-col items-center justify-center p-6 cursor-pointer rounded-lg border-2 border-dashed transition-colors
                              border-neutral-300 hover:border-primary
                              dark:border-neutral-700 dark:hover:border-primary-light">
              <span className="mb-1 text-sm text-neutral-700 dark:text-neutral-300">
                {newVolFileName ? newVolFileName : "點擊選擇 .txt / .md 檔案"}
              </span>
              <span className="text-xs text-neutral-400 dark:text-neutral-500">
                支援 UTF-8 編碼
              </span>
              <input
                type="file"
                accept=".txt,.md,text/plain,text/markdown"
                onChange={handleNewVolFileSelect}
                className="hidden"
              />
            </label>

            {newVolPreviewChapters.length > 0 && (
              <div className="mt-3">
                <p className="mb-2 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  偵測到 {newVolPreviewChapters.length} 個章節:
                </p>
                <div className="border rounded-lg max-h-40 overflow-y-auto divide-y
                                border-neutral-200 divide-neutral-100
                                dark:border-neutral-800 dark:divide-neutral-800">
                  {newVolPreviewChapters.map((ch) => (
                    <div
                      key={ch.chapterNumber}
                      className="flex justify-between gap-3 px-4 py-2 text-sm"
                    >
                      <span className="text-neutral-900 dark:text-neutral-100">
                        {formatChapterLabelText(ch)}
                      </span>
                      <span className="text-neutral-400 dark:text-neutral-500">
                        {ch.wordCount} 字
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 操作按鈕 */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setError("");
              }}
              disabled={busy}
              className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors
                         bg-neutral-100 text-neutral-700 hover:bg-neutral-200
                         dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleConfirmAddVolume}
              disabled={busy || newVolPreviewChapters.length === 0}
              className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors
                         bg-primary text-white hover:bg-primary-dark
                         disabled:opacity-60"
            >
              {busy
                ? uploadProgress.total > 0
                  ? `上傳中 ${uploadProgress.done}/${uploadProgress.total}`
                  : "處理中..."
                : `確認新增「${newVolTitle.trim() || `卷 ${nextVolumeNumber}`}」`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
