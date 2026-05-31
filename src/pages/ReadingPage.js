// ============================================
// 檔案名稱: ReadingPage.js
// 路徑: src/pages/ReadingPage.js
// 用途: 小說章節閱讀頁 — 沉浸式閱讀模式 (紙白底 / 夜間深底,
//       內文宋體 + drop cap + 1.85 行距,800px 最大寬度,不放 Footer 維持沉浸)
//
// 支援兩種路由:
//   1. /novel/:id/read/:chapter        — 單卷小說
//   2. /novel/:id/read/:vol/:ch        — 分卷小說(URL 多帶卷號)
// ============================================

import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  List,
  AlertCircle,
} from "lucide-react";
import Navbar from "../components/Navbar";
import { getNovelById } from "../utils/novelsHelper";
import { markChapterAsRead } from "../utils/readHistoryManager";
import CommentsSection from "../components/CommentsSection";
import { ReadingPageSkeleton } from "../components/Skeleton";
import { getChapter, getChaptersMetadata } from "../firebase/chapters";
import { formatChapterLabel } from "../utils/chapterLabel";

const CHARS_PER_PAGE = 3000;

// 字級三段:小 / 中 / 大
const FONT_SIZES = {
  small: "1rem",
  medium: "1.15rem",
  large: "1.4rem",
};
const FONT_SIZE_KEY = "pr-novel-reading-size";

// 工具:依分卷模式產生閱讀頁 URL
function buildReadPath(novelId, chapter) {
  return chapter.volumeNumber != null
    ? `/novel/${novelId}/read/${chapter.volumeNumber}/${chapter.chapterNumber}`
    : `/novel/${novelId}/read/${chapter.chapterNumber}`;
}

// 工具:章節排序(分卷小說要先 by volumeNumber,再 by chapterNumber)
function sortChapters(chapters) {
  return [...chapters].sort((a, b) => {
    const aVol = a.volumeNumber ?? 0;
    const bVol = b.volumeNumber ?? 0;
    if (aVol !== bVol) return aVol - bVol;
    return a.chapterNumber - b.chapterNumber;
  });
}

function ReadingPage() {
  const params = useParams();
  const navigate = useNavigate();
  const contentRef = useRef(null);

  const { id } = params;
  // 判斷路由型態:有 vol 參數就是分卷,否則就是單卷
  const isVolumed = params.vol !== undefined;
  const volumeNumber = isVolumed ? parseInt(params.vol, 10) : null;
  const chapterNumber = parseInt(isVolumed ? params.ch : params.chapter, 10);

  const [novel, setNovel] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [currentChapter, setCurrentChapter] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem(FONT_SIZE_KEY);
    return saved && FONT_SIZES[saved] ? saved : "medium";
  });

  const changeFontSize = (size) => {
    setFontSize(size);
    try {
      localStorage.setItem(FONT_SIZE_KEY, size);
    } catch (e) {
      console.warn("無法儲存字級偏好:", e.message);
    }
  };

  // ========== 載入小說資料 ==========
  useEffect(() => {
    const loadNovel = async () => {
      try {
        setLoading(true);
        setError(null);

        const foundNovel = getNovelById(id);
        if (!foundNovel) {
          setError("找不到此小說");
          return;
        }
        setNovel(foundNovel);

        // 章節列表從子集合抓 metadata,client 端排序(分卷要 by vol, ch)
        const chaptersMeta = await getChaptersMetadata(id);
        if (chaptersMeta.length === 0) {
          setError("此小說尚無章節");
          return;
        }
        setChapters(sortChapters(chaptersMeta));

        // 當前章節含內文(從 Storage fetch),分卷小說要帶 volumeNumber 才找得到對的 doc
        const currentChapterData = await getChapter(id, chapterNumber, volumeNumber);
        if (!currentChapterData) {
          setError("找不到此章節");
          return;
        }
        setCurrentChapter(currentChapterData);

        const pages = Math.ceil(
          (currentChapterData.content || "").length / CHARS_PER_PAGE
        );
        setTotalPages(pages);

        // 從 URL ?page=N 讀取初始頁碼,超出範圍時 clamp
        const urlPage = parseInt(
          new URLSearchParams(window.location.search).get("page"),
          10
        );
        const initPage =
          Number.isFinite(urlPage) && urlPage > 0
            ? Math.min(urlPage, pages || 1)
            : 1;
        setCurrentPage(initPage);
        setLoading(false);
      } catch (err) {
        console.error("載入失敗:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    loadNovel();
  }, [id, chapterNumber, volumeNumber]);

  // ========== 同步當前頁碼:URL ?page= 與 readHistory.lastPage ==========
  // - 章節載入完成後 / 換頁時觸發
  // - URL 用 replaceState 不污染 history(返回鍵不會在頁碼間跳)
  // - currentPage === 1 時不寫 ?page=1(URL 保持乾淨)
  // - 章節剛切換、舊 currentPage 還沒重置時要擋住,
  //   否則會把 ?page=N 帶到新章節 URL
  useEffect(() => {
    if (!currentChapter || loading) return;
    const loadedVol = currentChapter.volumeNumber ?? null;
    if (
      currentChapter.chapterNumber !== chapterNumber ||
      loadedVol !== volumeNumber
    ) {
      return;
    }
    const url = new URL(window.location.href);
    if (currentPage > 1) {
      url.searchParams.set("page", String(currentPage));
    } else {
      url.searchParams.delete("page");
    }
    window.history.replaceState({}, "", url);
    markChapterAsRead(id, chapterNumber, currentPage, volumeNumber).catch(
      () => {}
    );
  }, [
    id,
    chapterNumber,
    volumeNumber,
    currentPage,
    currentChapter,
    loading,
  ]);

  // ========== 取得當前頁內容 ==========
  const getCurrentPageContent = () => {
    if (!currentChapter) return "";
    const start = (currentPage - 1) * CHARS_PER_PAGE;
    const end = start + CHARS_PER_PAGE;
    return currentChapter.content.slice(start, end);
  };

  // ========== 換頁後捲回頂部 ==========
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
  };

  // ========== 上一章 / 下一章(跨卷自動接續) ==========
  const handleChapterChange = (direction) => {
    // 用 (volumeNumber, chapterNumber) 兩個鍵找當前位置;單卷只用 chapterNumber
    const currentIndex = chapters.findIndex(
      (ch) =>
        ch.chapterNumber === chapterNumber &&
        (ch.volumeNumber ?? null) === volumeNumber
    );
    const newIndex = direction === "prev" ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0 || newIndex >= chapters.length) {
      alert(direction === "prev" ? "已經是第一章了" : "已經是最後一章了");
      return;
    }

    const newChapter = chapters[newIndex];
    navigate(buildReadPath(id, newChapter));
    window.scrollTo({ top: 0 });
  };

  // ========== Loading 狀態 ==========
  if (loading) {
    return (
      <div className="min-h-screen bg-reading-light dark:bg-reading-dark">
        <Navbar showBackButton={true} backTo={`/novel/${id}`} />
        <ReadingPageSkeleton />
      </div>
    );
  }

  // ========== Error 狀態 ==========
  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950">
        <Navbar showBackButton={true} backTo={`/novel/${id}`} />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-danger" />
            <p className="text-lg mb-6 text-neutral-700 dark:text-neutral-300">
              {error}
            </p>
            <button
              onClick={() => navigate(`/novel/${id}`)}
              className="px-6 py-3 rounded-lg font-semibold transition-colors
                         bg-primary text-white hover:bg-primary-dark"
            >
              返回小說詳情
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ========== 主要內容 ==========
  const currentChapterIndex = chapters.findIndex(
    (ch) =>
      ch.chapterNumber === chapterNumber &&
      (ch.volumeNumber ?? null) === volumeNumber
  );
  const hasPrevChapter = currentChapterIndex > 0;
  const hasNextChapter = currentChapterIndex < chapters.length - 1;

  const pageContent = getCurrentPageContent();
  const paragraphs = pageContent.split("\n");

  return (
    <div className="min-h-screen bg-reading-light dark:bg-reading-dark">
      <Navbar showBackButton={true} backTo={`/novel/${id}`} />

      {/* ========== 章節標題區 ========== */}
      <header className="border-b bg-white border-neutral-200
                         dark:bg-neutral-900 dark:border-neutral-800">
        <div className="container mx-auto px-4 py-6 max-w-3xl">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-center mb-2 break-words
                         text-neutral-900 dark:text-neutral-100">
            {(() => {
              const { prefix, title } = formatChapterLabel(currentChapter);
              if (!title) return prefix;
              return (
                <>
                  <span className="text-neutral-400 dark:text-neutral-500 font-normal">
                    {prefix} -{" "}
                  </span>
                  {title}
                </>
              );
            })()}
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm
                          text-neutral-500 dark:text-neutral-400">
            <span>{novel.title}</span>
            <span className="text-neutral-300 dark:text-neutral-700">·</span>
            <span>{novel.author}</span>
            <span className="text-neutral-300 dark:text-neutral-700">·</span>
            <span>{currentChapter.wordCount} 字</span>
            <span className="text-neutral-300 dark:text-neutral-700">·</span>
            {/* 字級切換 segmented control */}
            <div className="inline-flex gap-0.5 p-0.5 rounded-md
                            bg-neutral-100 dark:bg-neutral-800">
              {[
                { key: "small", label: "小", cls: "text-xs" },
                { key: "medium", label: "中", cls: "text-sm" },
                { key: "large", label: "大", cls: "text-base" },
              ].map(({ key, label, cls }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => changeFontSize(key)}
                  aria-label={`字級 ${label}`}
                  className={`px-2 py-0.5 rounded font-medium transition-all ${cls} ${
                    fontSize === key
                      ? "bg-white text-primary shadow-sm dark:bg-neutral-700 dark:text-primary-light"
                      : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {totalPages > 1 && (
            <div className="text-center text-xs mt-2 text-neutral-400 dark:text-neutral-500">
              第 {currentPage} / {totalPages} 頁
            </div>
          )}
        </div>
      </header>

      {/* ========== 內容區 ========== */}
      <div className="container mx-auto px-4 py-8 sm:py-10
                      max-w-[680px] md:max-w-[860px] lg:max-w-[960px]">
        <article
          ref={contentRef}
          className="font-heading font-medium leading-[1.85]
                     text-neutral-900 dark:text-neutral-100"
          style={{ fontSize: FONT_SIZES[fontSize] }}
        >
          {paragraphs.map((paragraph, index) => (
            <p key={index} className="mb-6 break-words indent-8">
              {paragraph}
            </p>
          ))}
        </article>

        {/* ========== 分頁控制 (章節內分頁,主要動作 — 大鈕) ========== */}
        {totalPages > 1 && (
          <div className="flex items-stretch gap-3 mt-10">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border-2 font-semibold transition-all
                         border-primary text-primary
                         hover:bg-primary hover:text-white
                         disabled:opacity-40 disabled:cursor-not-allowed
                         disabled:hover:bg-transparent disabled:hover:text-primary
                         dark:border-primary-light dark:text-primary-light
                         dark:hover:bg-primary-light dark:hover:text-neutral-900
                         dark:disabled:hover:bg-transparent dark:disabled:hover:text-primary-light"
            >
              <ChevronLeft className="w-4 h-4" />
              上一頁
            </button>
            <div className="flex items-center px-3 text-sm text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
              {currentPage} / {totalPages}
            </div>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border-2 font-semibold transition-all
                         border-primary text-primary
                         hover:bg-primary hover:text-white
                         disabled:opacity-40 disabled:cursor-not-allowed
                         disabled:hover:bg-transparent disabled:hover:text-primary
                         dark:border-primary-light dark:text-primary-light
                         dark:hover:bg-primary-light dark:hover:text-neutral-900
                         dark:disabled:hover:bg-transparent dark:disabled:hover:text-primary-light"
            >
              下一頁
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ========== 章節導航 (次要動作 — 小鈕) ========== */}
        <div className="flex flex-wrap justify-center items-center gap-2 mt-6">
          {hasPrevChapter && (
            <button
              onClick={() => handleChapterChange("prev")}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-lg border font-medium text-sm transition-all
                         border-neutral-300 text-neutral-700
                         hover:border-primary hover:text-primary
                         dark:border-neutral-700 dark:text-neutral-300
                         dark:hover:border-primary-light dark:hover:text-primary-light"
            >
              <ArrowLeft className="w-4 h-4" />
              上一章
            </button>
          )}

          <button
            onClick={() => navigate(`/novel/${id}`)}
            className="inline-flex items-center gap-1 px-4 py-2 rounded-lg border font-medium text-sm transition-all
                       border-neutral-300 text-neutral-700
                       hover:border-primary hover:text-primary
                       dark:border-neutral-700 dark:text-neutral-300
                       dark:hover:border-primary-light dark:hover:text-primary-light"
          >
            <List className="w-4 h-4" />
            目錄
          </button>

          {hasNextChapter && (
            <button
              onClick={() => handleChapterChange("next")}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-lg border font-medium text-sm transition-all
                         border-neutral-300 text-neutral-700
                         hover:border-primary hover:text-primary
                         dark:border-neutral-700 dark:text-neutral-300
                         dark:hover:border-primary-light dark:hover:text-primary-light"
            >
              下一章
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ========== 章節留言區 ========== */}
      <div className="container mx-auto px-4 pb-16 max-w-[800px]">
        <CommentsSection
          novelId={id}
          chapterNumber={chapterNumber}
          chapters={chapters}
        />
      </div>
    </div>
  );
}

export default ReadingPage;
