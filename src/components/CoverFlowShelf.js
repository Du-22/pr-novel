// ============================================
// 檔案名稱: CoverFlowShelf.js
// 路徑: src/components/CoverFlowShelf.js
// 用途: Cover Flow 風格 3D 書架瀏覽元件 — 中央展示一本立體書(idle 旋轉動畫 + hover 加成),
//       兩側書脊密集排列。支援箭頭按鈕 / 鍵盤 ← → / 手機 swipe 切換。
//       中央書點擊後導向 /novel/:id 詳情頁。
// ============================================

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import DefaultCover from "./DefaultCover";
import "./CoverFlowShelf.css";

const DEFAULT_COVER_PATH = "/images/covers/default-cover.png";

// 跟 DefaultCover 同步的 8 種 palette — 書脊用同一組顏色,讓書架視覺統一
const PALETTE = [
  { light: "linear-gradient(160deg, #6C5CE7 0%, #5849D6 100%)", dark: "linear-gradient(160deg, #4338CA 0%, #312E81 100%)", spine: "#5849D6" },
  { light: "linear-gradient(160deg, #2D3436 0%, #4A5568 100%)", dark: "linear-gradient(160deg, #18181B 0%, #27272A 100%)", spine: "#2D3436" },
  { light: "linear-gradient(160deg, #C44569 0%, #8B2D4D 100%)", dark: "linear-gradient(160deg, #831843 0%, #500724 100%)", spine: "#8B2D4D" },
  { light: "linear-gradient(160deg, #3B5998 0%, #1F3A5F 100%)", dark: "linear-gradient(160deg, #1E3A5F 0%, #0F1F33 100%)", spine: "#1F3A5F" },
  { light: "linear-gradient(160deg, #1B4332 0%, #2D6A4F 100%)", dark: "linear-gradient(160deg, #0F2D1E 0%, #1A3D2A 100%)", spine: "#1B4332" },
  { light: "linear-gradient(160deg, #B8860B 0%, #8B6914 100%)", dark: "linear-gradient(160deg, #78491E 0%, #4A2D14 100%)", spine: "#8B6914" },
  { light: "linear-gradient(160deg, #6B4423 0%, #4A2F18 100%)", dark: "linear-gradient(160deg, #3F2614 0%, #25160A 100%)", spine: "#4A2F18" },
  { light: "linear-gradient(160deg, #4B0082 0%, #2D004F 100%)", dark: "linear-gradient(160deg, #2D004F 0%, #15002B 100%)", spine: "#2D004F" },
];

// 字串 hash → 確保同一書名永遠對應同一 palette(跟 DefaultCover 同步)
const hashStr = (str) => {
  let h = 0;
  for (let i = 0; i < (str || "").length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
};

// 響應式 config — 三組斷點對應的書本/間距/字級設定
const CONFIGS = {
  mobile: {
    centerGap: 130,
    spineGap: 48,
    zStep: 80,
    spineWidth: 38,
    spineFontSize: 12,
    bookWidth: 170,
    thickness: 22,
    centerTilt: 18,
    hoverAdd: 10,
    transition: 0.7,
    maxVisible: 3,
  },
  tablet: {
    centerGap: 180,
    spineGap: 60,
    zStep: 100,
    spineWidth: 45,
    spineFontSize: 14,
    bookWidth: 215,
    thickness: 28,
    centerTilt: 20,
    hoverAdd: 11,
    transition: 0.8,
    maxVisible: 4,
  },
  desktop: {
    centerGap: 220,
    spineGap: 70,
    zStep: 120,
    spineWidth: 50,
    spineFontSize: 15,
    bookWidth: 250,
    thickness: 30,
    centerTilt: 20,
    hoverAdd: 12,
    transition: 0.85,
    maxVisible: 4,
  },
};

const getBreakpoint = (w) => {
  if (w < 640) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
};

const CoverFlowShelf = ({ books = [], initialIndex }) => {
  const navigate = useNavigate();
  const shelfRef = useRef(null);
  const touchStartXRef = useRef(null);

  // ========== 響應式 config(視窗縮放時自動切換) ==========
  const [breakpoint, setBreakpoint] = useState(() =>
    typeof window !== "undefined" ? getBreakpoint(window.innerWidth) : "desktop"
  );
  useEffect(() => {
    const onResize = () => setBreakpoint(getBreakpoint(window.innerWidth));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const config = CONFIGS[breakpoint];

  // ========== 當前置中的書 index ==========
  const [currentIndex, setCurrentIndex] = useState(() => {
    if (typeof initialIndex === "number") return initialIndex;
    return Math.max(0, Math.floor(books.length / 2));
  });

  // ========== 偵測 dark mode(供 spine 漸層動態切換) ==========
  // 用 MutationObserver 監聽 documentElement.class,不依賴 useDarkMode hook
  // 讓元件可在任何頁面獨立運作
  const [isDark, setIsDark] = useState(() =>
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark")
  );
  useEffect(() => {
    if (typeof document === "undefined") return;
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  // ========== 導覽 actions ==========
  const next = useCallback(() => {
    setCurrentIndex((i) => Math.min(i + 1, books.length - 1));
  }, [books.length]);

  const prev = useCallback(() => {
    setCurrentIndex((i) => Math.max(i - 1, 0));
  }, []);

  // ========== 鍵盤 ← → ==========
  useEffect(() => {
    const onKey = (e) => {
      // 在 input/textarea 中編輯時不要劫持方向鍵
      const tag = e.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  // ========== 手機 swipe ==========
  useEffect(() => {
    const shelf = shelfRef.current;
    if (!shelf) return;

    const onStart = (e) => {
      touchStartXRef.current = e.touches[0].clientX;
    };
    const onEnd = (e) => {
      if (touchStartXRef.current === null) return;
      const dx = e.changedTouches[0].clientX - touchStartXRef.current;
      if (Math.abs(dx) > 40) {
        if (dx > 0) prev();
        else next();
      }
      touchStartXRef.current = null;
    };

    shelf.addEventListener("touchstart", onStart, { passive: true });
    shelf.addEventListener("touchend", onEnd);
    return () => {
      shelf.removeEventListener("touchstart", onStart);
      shelf.removeEventListener("touchend", onEnd);
    };
  }, [next, prev]);

  // ========== 點擊中央書 → 進入詳情頁(側邊書脊不可點) ==========
  const handleBookClick = (book, state) => {
    if (state !== "center") return;
    // 跟 NovelCard 一樣用 Firestore id 優先,否則用本地 id
    const id = book.firestoreId || book.id;
    navigate(`/novel/${id}`);
  };

  // ========== CSS 變數(動態傳給子層,支援響應式縮放) ==========
  const shelfStyle = {
    "--cf-bookWidth": `${config.bookWidth}px`,
    "--cf-thickness": `${config.thickness}px`,
    "--cf-spineWidth": `${config.spineWidth}px`,
    "--cf-spineFontSize": `${config.spineFontSize}px`,
    "--cf-centerTilt": `${config.centerTilt}deg`,
    "--cf-hoverAdd": `${config.hoverAdd}deg`,
    "--cf-transition": `${config.transition}s`,
  };

  const currentBook = books[currentIndex];

  if (!books || books.length === 0) return null;

  return (
    <div className="cf-root">
      {/* ====== Shelf Wrap (perspective + nav) ====== */}
      <div className="cf-shelf-wrap">
        <button
          type="button"
          onClick={prev}
          disabled={currentIndex === 0}
          aria-label="上一本"
          className="cf-nav-btn cf-nav-btn--prev"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="cf-shelf" ref={shelfRef} style={shelfStyle}>
          <div className="cf-floor" />

          {books.map((book, i) => {
            const offset = i - currentIndex;
            const absOffset = Math.abs(offset);
            const sign = Math.sign(offset);
            const palette = PALETTE[hashStr(book.title) % PALETTE.length];
            const gradient = isDark ? palette.dark : palette.light;
            const isDefaultCover =
              !book.coverImage || book.coverImage === DEFAULT_COVER_PATH;

            // 計算 transform / 可見性
            let state, transform, zIndex, opacity;
            if (offset === 0) {
              state = "center";
              transform = "translate3d(0, 0, 0)";
              zIndex = 100;
              opacity = 1;
            } else {
              state = "side";
              const x = sign * (config.centerGap + (absOffset - 1) * config.spineGap);
              const z = -absOffset * config.zStep;
              transform = `translate3d(${x}px, 0, ${z}px)`;
              zIndex = 100 - absOffset;
              opacity =
                absOffset > config.maxVisible
                  ? 0
                  : absOffset === config.maxVisible
                  ? 0.45
                  : 1;
            }

            return (
              <article
                key={book.id || i}
                className="cf-book"
                data-state={state}
                style={{
                  transform,
                  zIndex,
                  opacity,
                  pointerEvents: opacity === 0 ? "none" : "auto",
                  "--cover-spine": palette.spine,
                }}
                onClick={() => handleBookClick(book, state)}
              >
                {/* mode-spine: 側邊書脊卡(2D) */}
                <div
                  className="cf-mode-spine"
                  style={{ background: gradient }}
                >
                  <span className="cf-spine-title">{book.title}</span>
                </div>

                {/* mode-3d: 中央 3D 書(6 個面) */}
                <div className="cf-mode-3d">
                  <div className="cf-book-outer">
                    <div className="cf-book-inner">
                      {/* 封面 — 有上傳就用圖,否則用 DefaultCover 元件 */}
                      {isDefaultCover ? (
                        <div className="cf-cover cf-cover--default">
                          <DefaultCover
                            title={book.title}
                            author={book.author}
                            className="w-full h-full"
                          />
                        </div>
                      ) : (
                        <div
                          className="cf-cover"
                          style={{
                            backgroundImage: `url(${book.coverImage})`,
                          }}
                        />
                      )}

                      {/* 書背 */}
                      <div className="cf-back" />

                      {/* 書脊(直書文字) */}
                      <div className="cf-3d-spine">
                        <span className="cf-3d-spine-title">{book.title}</span>
                      </div>

                      {/* 三邊紙頁 */}
                      <div className="cf-top" />
                      <div className="cf-bottom" />
                      <div className="cf-edge" />
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <button
          type="button"
          onClick={next}
          disabled={currentIndex === books.length - 1}
          aria-label="下一本"
          className="cf-nav-btn cf-nav-btn--next"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* ====== Meta — 中央書本資訊 ====== */}
      {currentBook && (
        <div className="mx-auto max-w-2xl text-center px-6 pt-2 pb-4">
          {/* 標籤 */}
          {currentBook.tags && currentBook.tags.length > 0 && (
            <div className="mb-3 flex flex-wrap justify-center gap-1.5">
              {currentBook.tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-2.5 py-0.5 text-[11px] rounded-full
                             bg-neutral-100 text-neutral-700
                             dark:bg-neutral-800 dark:text-neutral-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* 標題 + 作者 */}
          <h3
            className="mb-1 font-body font-medium text-2xl sm:text-3xl tracking-tight
                       text-neutral-900 dark:text-neutral-100"
          >
            {currentBook.title}
          </h3>
          <p className="mb-3 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            {currentBook.author}
          </p>

          {/* 簡介(line-clamp 控制最多行數) */}
          {currentBook.summary && (
            <p className="mb-2 text-sm sm:text-base leading-relaxed break-words
                          line-clamp-2 sm:line-clamp-3
                          text-neutral-600 dark:text-neutral-400">
              {currentBook.summary}
            </p>
          )}

          {/* 計數點點 */}
          <div className="flex justify-center gap-1.5 mt-4">
            {books.map((_, i) => (
              <span
                key={i}
                className={`block h-1.5 rounded-full transition-all duration-300 ${
                  i === currentIndex
                    ? "w-4 bg-primary"
                    : "w-1.5 bg-neutral-300 dark:bg-neutral-700"
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CoverFlowShelf;
