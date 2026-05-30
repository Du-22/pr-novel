// ============================================
// 檔案名稱: ReadingPage.js
// 路徑: src/pages/ReadingPage.js
// 用途: 小說章節閱讀頁 — 沉浸式閱讀模式 (紙白底 / 夜間深底,
//       內文宋體 + drop cap + 1.85 行距,800px 最大寬度,不放 Footer 維持沉浸)
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

function ReadingPage() {
  const { id, chapter } = useParams();
  const navigate = useNavigate();
  const contentRef = useRef(null);

  const [novel, setNovel] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [currentChapter, setCurrentChapter] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const chapterNumber = parseInt(chapter);

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

        // 章節列表從子集合抓 metadata
        const chaptersMeta = await getChaptersMetadata(id);
        if (chaptersMeta.length === 0) {
          setError("此小說尚無章節");
          return;
        }
        setChapters(chaptersMeta);

        // 當前章節含內文（從 Storage fetch）
        const currentChapterData = await getChapter(id, chapterNumber);
        if (!currentChapterData) {
          setError("找不到此章節");
          return;
        }
        setCurrentChapter(currentChapterData);

        const pages = Math.ceil(
          (currentChapterData.content || "").length / CHARS_PER_PAGE
        );
        setTotalPages(pages);

        setCurrentPage(1);
        setLoading(false);
      } catch (err) {
        console.error("載入失敗:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    loadNovel();
  }, [id, chapterNumber]);

  // ========== 進入章節時立即標記為已讀 ==========
  useEffect(() => {
    if (currentChapter) {
      markChapterAsRead(id, chapterNumber).catch(() => {});
    }
  }, [id, chapterNumber, currentChapter]);

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

  const handleChapterChange = (direction) => {
    const currentIndex = chapters.findIndex(
      (ch) => ch.chapterNumber === chapterNumber
    );
    let newIndex = direction === "prev" ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0 || newIndex >= chapters.length) {
      alert(direction === "prev" ? "已經是第一章了" : "已經是最後一章了");
      return;
    }

    const newChapter = chapters[newIndex];
    navigate(`/novel/${id}/read/${newChapter.chapterNumber}`);
    window.scrollTo({ top: 0 });
  };

  // ========== Loading 狀態 ==========
  if (loading) {
    return (
      <div className="min-h-screen bg-reading-light dark:bg-reading-dark">
        <Navbar showBackButton={true} />
        <ReadingPageSkeleton />
      </div>
    );
  }

  // ========== Error 狀態 ==========
  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950">
        <Navbar showBackButton={true} />
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
    (ch) => ch.chapterNumber === chapterNumber
  );
  const hasPrevChapter = currentChapterIndex > 0;
  const hasNextChapter = currentChapterIndex < chapters.length - 1;

  const pageContent = getCurrentPageContent();
  const paragraphs = pageContent.split("\n");

  return (
    <div className="min-h-screen bg-reading-light dark:bg-reading-dark">
      <Navbar showBackButton={true} />

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
          className="font-heading font-medium text-[1.1rem] sm:text-[1.15rem] leading-[1.85]
                     text-neutral-900 dark:text-neutral-100"
        >
          {paragraphs.map((paragraph, index) => (
            <p key={index} className="mb-6 break-words indent-8">
              {paragraph}
            </p>
          ))}
        </article>

        {/* ========== 分頁控制 (章節內分頁) ========== */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 mt-10">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-lg border font-medium transition-all
                         border-neutral-300 text-neutral-700
                         hover:border-primary hover:text-primary
                         disabled:opacity-40 disabled:cursor-not-allowed
                         disabled:hover:border-neutral-300 disabled:hover:text-neutral-700
                         dark:border-neutral-700 dark:text-neutral-300
                         dark:hover:border-primary-light dark:hover:text-primary-light"
            >
              <ChevronLeft className="w-4 h-4" />
              上一頁
            </button>
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-lg border font-medium transition-all
                         border-neutral-300 text-neutral-700
                         hover:border-primary hover:text-primary
                         disabled:opacity-40 disabled:cursor-not-allowed
                         disabled:hover:border-neutral-300 disabled:hover:text-neutral-700
                         dark:border-neutral-700 dark:text-neutral-300
                         dark:hover:border-primary-light dark:hover:text-primary-light"
            >
              下一頁
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ========== 章節導航 ========== */}
        <div className="flex flex-wrap items-stretch gap-3 mt-10">
          {hasPrevChapter && (
            <button
              onClick={() => handleChapterChange("prev")}
              className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border-2 font-semibold transition-all
                         border-primary text-primary
                         hover:bg-primary hover:text-white
                         dark:border-primary-light dark:text-primary-light
                         dark:hover:bg-primary-light dark:hover:text-neutral-900"
            >
              <ArrowLeft className="w-4 h-4" />
              上一章
            </button>
          )}

          <button
            onClick={() => navigate(`/novel/${id}`)}
            className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all
                       bg-neutral-100 text-neutral-700 hover:bg-neutral-200
                       dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
          >
            <List className="w-4 h-4" />
            目錄
          </button>

          {hasNextChapter && (
            <button
              onClick={() => handleChapterChange("next")}
              className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border-2 font-semibold transition-all
                         border-primary text-primary
                         hover:bg-primary hover:text-white
                         dark:border-primary-light dark:text-primary-light
                         dark:hover:bg-primary-light dark:hover:text-neutral-900"
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
