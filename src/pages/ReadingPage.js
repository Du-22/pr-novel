import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getNovelById } from "../utils/novelsHelper";
import { markChapterAsRead } from "../utils/readHistoryManager";
import CommentsSection from "../components/CommentsSection";
import { parseNovelChapters } from "../utils/parser";
import { ReadingPageSkeleton } from "../components/Skeleton";
import { ref, getBytes } from "firebase/storage";
import { storage } from "../firebase/config";
import { getChapter } from "../firebase/chapters";

const CHARS_PER_PAGE = 3000; // 每頁字數上限

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
  // 快取已從 Storage 下載並解析的章節（含 content），避免重複 fetch
  const txtCacheRef = useRef(null);

  // ========== 載入小說資料 ==========
  useEffect(() => {
    const loadNovel = async () => {
      try {
        setLoading(true);
        setError(null);

        // 找到小說 (支援 mockData + 上傳的小說)
        const foundNovel = getNovelById(id);
        if (!foundNovel) {
          setError("找不到此小說");
          return;
        }
        setNovel(foundNovel);

        let currentChapterData = null;

        if (foundNovel.txtUrl) {
          // 舊格式：從 Storage 取得 TXT（有快取則直接使用）
          let parsedChapters = [];
          if (txtCacheRef.current && txtCacheRef.current.novelId === id) {
            parsedChapters = txtCacheRef.current.chapters;
          } else {
            const storageRef = ref(storage, `novels/${id}/content.txt`);
            const bytes = await getBytes(storageRef);
            const text = new TextDecoder("utf-8").decode(bytes);
            parsedChapters = parseNovelChapters(text);
            txtCacheRef.current = { novelId: id, chapters: parsedChapters };
          }
          if (parsedChapters.length === 0) {
            setError("無法解析章節");
            return;
          }
          setChapters(parsedChapters);
          currentChapterData = parsedChapters.find(
            (ch) => ch.chapterNumber === chapterNumber
          );
        } else {
          const chaptersData = foundNovel.chapters || [];
          if (chaptersData.length === 0) {
            setError("此小說尚無章節");
            return;
          }
          setChapters(chaptersData);

          // 新格式（Phase 18+）：從子集合讀取
          currentChapterData = await getChapter(id, chapterNumber);

          // 最舊格式 fallback（Phase 18 以前）：內容直接在 chapters 陣列裡
          if (!currentChapterData) {
            currentChapterData = chaptersData.find(
              (ch) => ch.chapterNumber === chapterNumber
            );
          }
        }

        if (!currentChapterData) {
          setError("找不到此章節");
          return;
        }
        setCurrentChapter(currentChapterData);

        // 計算分頁數
        const pages = Math.ceil((currentChapterData.content || "").length / CHARS_PER_PAGE);
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

  // ========== 換頁處理 ==========
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
  };

  // ========== 切換章節 ==========
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
      <div className="min-h-screen bg-[#FEFDFB]">
        <Navbar showBackButton={true} />
        <ReadingPageSkeleton />
      </div>
    );
  }

  // ========== Error 狀態 ==========
  if (error) {
    return (
      <div className="min-h-screen bg-light">
        <Navbar showBackButton={true} />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-red-500 text-xl mb-4">✖ {error}</p>
            <button
              onClick={() => navigate(`/novel/${id}`)}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-purple-700 transition"
            >
              返回小說詳情
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ========== 主要內容 ==========
  return (
    <div className="min-h-screen bg-[#FEFDFB]">
      {/* 導覽列 */}
      <Navbar showBackButton={true} />

      {/* 章節標題區 */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <h1 className="text-2xl font-bold text-dark text-center mb-2 break-words">
            {currentChapter.title}
          </h1>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
            <span>{novel.title}</span>
            <span>•</span>
            <span>{novel.author}</span>
            <span>•</span>
            <span>{currentChapter.wordCount} 字</span>
          </div>
          {totalPages > 1 && (
            <div className="text-center text-sm text-gray-500 mt-2">
              第 {currentPage} / {totalPages} 頁
            </div>
          )}
        </div>
      </div>

      {/* 內容區 */}
      <div className="container mx-auto px-4 py-8 max-w-[800px]">
        <div
          ref={contentRef}
          className="prose prose-lg max-w-none bg-white rounded-lg shadow-sm p-8 md:p-12"
          style={{
            fontSize: "1.1rem",
            lineHeight: "1.8",
            color: "#2D3436",
          }}
        >
          {getCurrentPageContent()
            .split("\n")
            .map((paragraph, index) => (
              <p key={index} className="mb-4 indent-8">
                {paragraph}
              </p>
            ))}
        </div>

        {/* 分頁控制 */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-200 text-dark rounded-lg hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              上一頁
            </button>
            <span className="text-gray-600">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-gray-200 text-dark rounded-lg hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一頁
            </button>
          </div>
        )}

        {/* 章節導航 */}
        <div className="flex justify-between items-center mt-8 gap-4">
          {/* 上一章按鈕 (第一章時隱藏) */}
          {chapters.findIndex((ch) => ch.chapterNumber === chapterNumber) >
            0 && (
            <button
              onClick={() => handleChapterChange("prev")}
              className="flex-1 px-6 py-3 bg-secondary text-white rounded-lg hover:bg-purple-400 transition"
            >
              ← 上一章
            </button>
          )}

          {/* 目錄按鈕 */}
          <button
            onClick={() => navigate(`/novel/${id}`)}
            className="flex-1 px-6 py-3 bg-gray-200 text-dark rounded-lg hover:bg-gray-300 transition"
          >
            目錄
          </button>

          {/* 下一章按鈕 (最後一章時隱藏) */}
          {chapters.findIndex((ch) => ch.chapterNumber === chapterNumber) <
            chapters.length - 1 && (
            <button
              onClick={() => handleChapterChange("next")}
              className="flex-1 px-6 py-3 bg-secondary text-white rounded-lg hover:bg-purple-400 transition"
            >
              下一章 →
            </button>
          )}
        </div>
      </div>

      {/* 章節留言區 */}
      <div className="max-w-[800px] mx-auto px-4 pb-16">
        <CommentsSection novelId={id} chapterNumber={chapterNumber} chapters={chapters} />
      </div>
    </div>
  );
}

export default ReadingPage;
