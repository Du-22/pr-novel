// ============================================
// 檔案名稱: NovelVisibilityManager.js
// 路徑: src/components/admin/NovelVisibilityManager.js
// 用途: 管理員搜尋小說並切換公開／隱藏狀態
// ============================================

import React, { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Search } from "lucide-react";
import { Link } from "react-router-dom";
import {
  backfillNovelVisibility,
  getAllNovels,
  setNovelHiddenState,
} from "../../firebase/novels";
import { refreshNovels } from "../../utils/novelsHelper";
import ConfirmDialog from "../ConfirmDialog";

export default function NovelVisibilityManager({ userId }) {
  const [novels, setNovels] = useState([]);
  const [queryText, setQueryText] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionNovel, setActionNovel] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadNovels = async () => {
    setLoading(true);
    setError("");
    try {
      await backfillNovelVisibility(userId);
      const data = await getAllNovels(userId);
      data.sort((a, b) => (a.title || "").localeCompare(b.title || "", "zh-Hant"));
      setNovels(data);
      await refreshNovels(userId);
    } catch (err) {
      console.error("載入小說管理列表失敗:", err);
      setError("無法載入小說列表，請確認 Firebase 規則已部署後再重試。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNovels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const filteredNovels = useMemo(() => {
    const keyword = queryText.trim().toLocaleLowerCase("zh-Hant");
    if (!keyword) return novels;
    return novels.filter((novel) =>
      [novel.title, novel.author, novel.uploaderName]
        .filter(Boolean)
        .some((value) => value.toLocaleLowerCase("zh-Hant").includes(keyword))
    );
  }, [novels, queryText]);

  const hiddenCount = novels.filter((novel) => novel.isHidden).length;

  const handleConfirm = async () => {
    if (!actionNovel || saving) return;
    const nextHidden = !actionNovel.isHidden;
    setSaving(true);
    setError("");
    try {
      await setNovelHiddenState(actionNovel.id, nextHidden, userId);
      setNovels((current) => current.map((novel) =>
        novel.id === actionNovel.id ? { ...novel, isHidden: nextHidden } : novel
      ));
      await refreshNovels(userId);
      setActionNovel(null);
    } catch (err) {
      console.error("更新小說隱藏狀態失敗:", err);
      setError("狀態更新失敗，請稍後再試。");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section aria-labelledby="novel-visibility-heading">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6">
        <div>
          <h2 id="novel-visibility-heading" className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
            小說顯示狀態
          </h2>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            共 {novels.length} 本小說，{hiddenCount} 本已隱藏
          </p>
        </div>
        <label className="relative block w-full sm:w-72">
          <span className="sr-only">搜尋小說</span>
          <Search className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="search"
            value={queryText}
            onChange={(event) => setQueryText(event.target.value)}
            placeholder="搜尋書名、作者或上傳者"
            className="w-full rounded-lg border py-2.5 pl-9 pr-3 text-sm outline-none transition-colors
                       bg-white border-neutral-200 text-neutral-900 placeholder:text-neutral-400
                       focus:border-primary focus:ring-2 focus:ring-primary/20
                       dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-100 dark:placeholder:text-neutral-500"
          />
        </label>
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-lg border px-4 py-3 text-sm
                                   border-danger/20 bg-danger-light text-danger
                                   dark:bg-danger/10 dark:border-danger/30">
          {error}
        </p>
      )}

      {loading ? (
        <p className="py-12 text-center text-neutral-400 dark:text-neutral-500">載入中...</p>
      ) : filteredNovels.length === 0 ? (
        <div className="rounded-2xl border py-12 text-center
                        bg-white border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800">
          <Search className="mx-auto mb-3 h-6 w-6 text-neutral-400" />
          <p className="text-neutral-500 dark:text-neutral-400">
            {novels.length === 0 ? "目前沒有小說" : "找不到符合條件的小說"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNovels.map((novel) => (
            <article
              key={novel.id}
              className="flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center
                         bg-white border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to={`/novel/${novel.id}`}
                    className="font-semibold break-words text-neutral-900 hover:text-primary
                               dark:text-neutral-100 dark:hover:text-primary-light"
                  >
                    {novel.title || "未命名小說"}
                  </Link>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                    novel.isHidden
                      ? "bg-warning-light text-warning dark:bg-warning/10"
                      : "bg-success-light text-success dark:bg-success/10"
                  }`}>
                    {novel.isHidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    {novel.isHidden ? "已隱藏" : "公開"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  作者：{novel.author || "未填寫"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActionNovel(novel)}
                className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  novel.isHidden
                    ? "border-success/30 text-success hover:bg-success-light dark:hover:bg-success/10"
                    : "border-warning/30 text-warning hover:bg-warning-light dark:hover:bg-warning/10"
                }`}
              >
                {novel.isHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                {novel.isHidden ? "恢復公開" : "隱藏小說"}
              </button>
            </article>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(actionNovel)}
        title={actionNovel?.isHidden ? "恢復公開小說" : "隱藏小說"}
        message={actionNovel?.isHidden
          ? `確定要恢復公開《${actionNovel?.title}》嗎？恢復後所有訪客都能查看。`
          : `確定要隱藏《${actionNovel?.title}》嗎？隱藏後只有管理員能查看。`}
        confirmText={saving ? "處理中..." : actionNovel?.isHidden ? "恢復公開" : "確認隱藏"}
        confirmVariant={actionNovel?.isHidden ? "primary" : "danger"}
        onConfirm={handleConfirm}
        onCancel={() => !saving && setActionNovel(null)}
      />
    </section>
  );
}
