// ============================================
// 檔案名稱: NovelDetailPage.js
// 路徑: src/pages/NovelDetailPage.js
// 用途: 小說詳情頁 — 封面 + 簡介 + 章節目錄 + 評分 + 收藏 + 相似推薦 + 留言
//       無封面時自動套用 DefaultCover,收藏按鈕用 warm accent (整體 design 的關鍵 accent moment)
// ============================================

import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { BookOpen, Heart, Check, X } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import NovelCard from "../components/NovelCard";
import DefaultCover from "../components/DefaultCover";
import CommentsSection from "../components/CommentsSection";
import RatingDisplay from "../components/RatingDisplay";
import RatingInput from "../components/RatingInput";
import { NovelDetailSkeleton } from "../components/Skeleton";
import { getAllNovels } from "../utils/novelsHelper";
import { getTotalWordCount, formatWordCount } from "../utils/parser";
import { getNovelsByTag } from "../utils/random";
import { getNovelReadData } from "../utils/readHistoryManager";
import {
  incrementNovelViews,
  incrementNovelFavorites,
  decrementNovelFavorites,
  getNovelById as fetchNovelStats,
} from "../firebase/novels";
import {
  isFavorited as checkIsFavorited,
  addFavorite,
  removeFavorite,
} from "../utils/favoritesManager";
import { useAuth } from "../hooks/useAuth";
import { getUserRating, submitRating, getRatingStats } from "../firebase/ratings";

const DEFAULT_COVER_PATH = "/images/covers/default-cover.png";

// 共用 Card 樣式 — 白底 (dark mode 黑底) + subtle 邊框 + 圓角
const Card = ({ children, className = "" }) => (
  <div
    className={`rounded-2xl border p-5 sm:p-6
                bg-white border-neutral-200
                dark:bg-neutral-900 dark:border-neutral-800
                ${className}`}
  >
    {children}
  </div>
);

export default function NovelDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [novel, setNovel] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [similarNovels, setSimilarNovels] = useState([]);
  const [readChapters, setReadChapters] = useState([]);
  const [lastChapter, setLastChapter] = useState(null);
  const [stats, setStats] = useState({ views: 0, favorites: 0 });
  const [ratingStats, setRatingStats] = useState({ ratingSum: 0, ratingCount: 0 });
  const [userRating, setUserRating] = useState(null);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [showCoverLightbox, setShowCoverLightbox] = useState(false);
  // 防止 React StrictMode 雙重觸發閱讀數
  const incrementedForIdRef = useRef(null);

  useEffect(() => {
    loadNovelData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, navigate]);

  const loadNovelData = async () => {
    const allNovels = getAllNovels();
    const foundNovel = allNovels.find((n) => n.id === id);

    if (!foundNovel) {
      navigate("/");
      return;
    }
    setNovel(foundNovel);

    loadChapters(foundNovel);
    loadSimilarNovels(foundNovel, allNovels);

    const { readChapters: readChs, lastChapter: lastCh } = await getNovelReadData(id);
    setReadChapters(readChs);
    setLastChapter(lastCh);

    const freshNovel = await fetchNovelStats(id);
    const baseViews = freshNovel?.stats?.views ?? foundNovel.stats?.views ?? 0;
    const baseFavorites = freshNovel?.stats?.favorites ?? foundNovel.stats?.favorites ?? 0;
    if (incrementedForIdRef.current !== id) {
      incrementedForIdRef.current = id;
      setStats({ views: baseViews + 1, favorites: baseFavorites });
      incrementNovelViews(id).catch(() => {});
    } else {
      setStats({ views: baseViews, favorites: baseFavorites });
    }

    const favorited = await checkIsFavorited(id);
    setIsFavorited(favorited);

    const ratingData = await getRatingStats(id);
    setRatingStats(ratingData);
  };

  useEffect(() => {
    if (user && id) {
      getUserRating(id, user.uid).then(setUserRating);
    } else {
      setUserRating(null);
    }
  }, [user, id]);

  const handleRate = async (rating) => {
    if (!user || ratingSubmitting) return;
    setRatingSubmitting(true);
    try {
      const oldRating = userRating;
      await submitRating(id, user.uid, rating);
      setRatingStats((prev) => {
        if (oldRating === null) {
          return { ratingSum: prev.ratingSum + rating, ratingCount: prev.ratingCount + 1 };
        } else {
          return { ratingSum: prev.ratingSum - oldRating + rating, ratingCount: prev.ratingCount };
        }
      });
      setUserRating(rating);
    } catch (err) {
      console.error("評分失敗:", err);
    } finally {
      setRatingSubmitting(false);
    }
  };

  const loadChapters = async (novel) => {
    try {
      setLoading(true);
      if (novel.chapters && novel.chapters.length > 0) {
        setChapters(novel.chapters);
      }
    } catch (error) {
      console.error("載入章節失敗:", error);
      setChapters([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSimilarNovels = (currentNovel, allNovels) => {
    const tag = currentNovel.tags[0];
    let similar = getNovelsByTag(allNovels, tag).filter((n) => n.id !== currentNovel.id);

    if (similar.length < 3 && currentNovel.tags.length > 1) {
      const moreNovels = getNovelsByTag(allNovels, currentNovel.tags[1]).filter(
        (n) => n.id !== currentNovel.id && !similar.includes(n)
      );
      similar = [...similar, ...moreNovels];
    }

    setSimilarNovels(similar.slice(0, 3));
  };

  const toggleFavorite = async () => {
    if (isFavorited) {
      await removeFavorite(id);
      decrementNovelFavorites(id).catch(() => {});
      setStats((prev) => ({ ...prev, favorites: Math.max(0, prev.favorites - 1) }));
      setIsFavorited(false);
    } else {
      await addFavorite(id);
      incrementNovelFavorites(id).catch(() => {});
      setStats((prev) => ({ ...prev, favorites: prev.favorites + 1 }));
      setIsFavorited(true);
    }
  };

  const startReading = () => {
    if (chapters.length === 0) return;
    if (lastChapter) {
      const chapterExists = chapters.find((c) => c.chapterNumber === lastChapter);
      if (chapterExists) {
        navigate(`/novel/${id}/read/${lastChapter}`);
        return;
      }
    }
    navigate(`/novel/${id}/read/${chapters[0].chapterNumber}`);
  };

  const getReadButtonText = () => {
    if (lastChapter) {
      const chapter = chapters.find((c) => c.chapterNumber === lastChapter);
      if (chapter) return `繼續閱讀 (${chapter.title})`;
      return `繼續閱讀 (第${lastChapter}章)`;
    }
    return "開始閱讀";
  };

  const isChapterRead = (chapterNumber) => readChapters.includes(chapterNumber);

  if (!novel) {
    if (loading) {
      return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
          <Navbar showBackButton={true} />
          <NovelDetailSkeleton />
        </div>
      );
    }
    return null;
  }

  const isDefaultCover =
    !novel.coverImage || novel.coverImage === DEFAULT_COVER_PATH;

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950">
      <Navbar showBackButton={true} />

      <main className="flex-1 container mx-auto px-4 py-8 md:py-12 max-w-5xl space-y-6 md:space-y-8">
        {/* ========== 小說資訊區 ========== */}
        <Card>
          <div className="grid gap-6 md:gap-8 md:grid-cols-[280px_1fr]">
            {/* 封面 */}
            <div className="mx-auto w-full max-w-[240px] md:max-w-none">
              <div
                onClick={() => setShowCoverLightbox(true)}
                className="aspect-[4/5] rounded-lg overflow-hidden shadow-lg cursor-pointer
                           bg-neutral-100 hover:opacity-90 transition-opacity
                           dark:bg-neutral-800"
              >
                {isDefaultCover ? (
                  <DefaultCover
                    title={novel.title}
                    author={novel.author}
                    className="w-full h-full"
                  />
                ) : (
                  <img
                    src={novel.coverImage}
                    alt={novel.title}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            </div>

            {/* 資訊 */}
            <div className="flex flex-col gap-4">
              {/* 標籤 */}
              <div className="flex flex-wrap gap-2">
                {novel.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-0.5 text-xs rounded-full
                               bg-neutral-100 text-neutral-700
                               dark:bg-neutral-800 dark:text-neutral-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* 標題 */}
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight break-words
                             text-neutral-900 dark:text-neutral-100">
                {novel.title}
              </h1>

              {/* 作者 */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm sm:text-base
                              text-neutral-600 dark:text-neutral-400">
                <span>
                  作者:{" "}
                  <strong className="text-neutral-900 dark:text-neutral-100">
                    {novel.author}
                  </strong>
                </span>
                {novel.translator && (
                  <>
                    <span className="text-neutral-300 dark:text-neutral-700">|</span>
                    <span>
                      譯者/上傳者:{" "}
                      {novel.authorUid ? (
                        <Link
                          to={`/user/${novel.authorUid}`}
                          className="text-primary hover:text-primary-dark
                                     dark:text-primary-light dark:hover:text-primary
                                     hover:underline underline-offset-2"
                        >
                          {novel.translator}
                        </Link>
                      ) : (
                        novel.translator
                      )}
                    </span>
                  </>
                )}
              </div>

              {/* 統計 */}
              <div className="flex flex-wrap gap-4 sm:gap-6 text-sm
                              text-neutral-600 dark:text-neutral-400">
                <div>
                  <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                    {stats.views}
                  </span>{" "}
                  閱讀
                </div>
                <div>
                  <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                    {stats.favorites}
                  </span>{" "}
                  收藏
                </div>
                <div>
                  <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                    {chapters.length}
                  </span>{" "}
                  章節
                </div>
                <div>
                  <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                    {formatWordCount(getTotalWordCount(chapters))}
                  </span>
                </div>
              </div>

              {/* 操作按鈕 */}
              <div className="flex flex-wrap gap-3 mt-2">
                {/* 開始閱讀 */}
                <button
                  onClick={startReading}
                  disabled={loading || chapters.length === 0}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all
                             bg-primary text-white shadow-sm
                             hover:bg-primary-dark hover:-translate-y-0.5 hover:shadow-md
                             disabled:bg-neutral-300 disabled:text-neutral-500 disabled:cursor-not-allowed
                             disabled:hover:translate-y-0 disabled:hover:shadow-sm
                             dark:disabled:bg-neutral-700 dark:disabled:text-neutral-500"
                >
                  <BookOpen className="w-5 h-5" />
                  {loading ? "載入中..." : getReadButtonText()}
                </button>

                {/* 收藏按鈕 — 整套 design 的 warm accent moment */}
                <button
                  onClick={toggleFavorite}
                  className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg border-2 font-semibold transition-all
                              hover:-translate-y-0.5 hover:shadow-md
                              ${
                                isFavorited
                                  ? "bg-warm text-neutral-900 border-warm hover:bg-warm-light"
                                  : "bg-transparent text-warm border-warm hover:bg-warm-50 dark:hover:bg-warm/10"
                              }`}
                >
                  <Heart
                    className="w-5 h-5"
                    fill={isFavorited ? "currentColor" : "none"}
                  />
                  {isFavorited ? "已收藏" : "加入收藏"}
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* ========== 故事簡介 ========== */}
        <Card>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-4
                         text-neutral-900 dark:text-neutral-100">
            故事簡介
          </h2>
          <p className="font-body text-base sm:text-lg leading-relaxed break-words
                        text-neutral-700 dark:text-neutral-300">
            {novel.summary}
          </p>
        </Card>

        {/* ========== 評分展示 ========== */}
        <RatingDisplay
          ratingSum={ratingStats.ratingSum}
          ratingCount={ratingStats.ratingCount}
        />

        {/* ========== 章節目錄 ========== */}
        <Card>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-4
                         text-neutral-900 dark:text-neutral-100">
            章節目錄
          </h2>

          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-14 rounded-lg bg-neutral-200 animate-pulse dark:bg-neutral-800"
                />
              ))}
            </div>
          ) : chapters.length === 0 ? (
            <p className="text-center py-8 text-neutral-500 dark:text-neutral-400">
              暫無章節
            </p>
          ) : (
            <div className="space-y-2">
              {chapters.map((chapter) => (
                <Link
                  key={chapter.chapterNumber}
                  to={`/novel/${id}/read/${chapter.chapterNumber}`}
                  className="group flex items-center justify-between p-3 sm:p-4 rounded-lg border transition-all
                             border-neutral-200 hover:border-primary hover:bg-primary/5
                             dark:border-neutral-800 dark:hover:border-primary-light dark:hover:bg-primary/10"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {isChapterRead(chapter.chapterNumber) && (
                      <Check className="w-4 h-4 flex-shrink-0 text-primary dark:text-primary-light" />
                    )}
                    <span
                      className={`font-medium break-words transition-colors
                                  group-hover:text-primary dark:group-hover:text-primary-light
                                  ${
                                    chapter.isSpecial
                                      ? "text-primary dark:text-primary-light"
                                      : "text-neutral-900 dark:text-neutral-100"
                                  }`}
                    >
                      {chapter.title}
                    </span>
                  </div>
                  <span className="flex-shrink-0 text-sm ml-3 text-neutral-500 dark:text-neutral-400">
                    {formatWordCount(chapter.wordCount)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* ========== 評分輸入 ========== */}
        <RatingInput
          user={user}
          userRating={userRating}
          onRate={handleRate}
          submitting={ratingSubmitting}
        />

        {/* ========== 你可能也喜歡 ========== */}
        {similarNovels.length > 0 && (
          <section>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-4
                           text-neutral-900 dark:text-neutral-100">
              你可能也喜歡
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {similarNovels.map((n) => (
                <NovelCard key={n.id} novel={n} />
              ))}
            </div>
          </section>
        )}

        {/* ========== 讀者評論區 ========== */}
        <CommentsSection novelId={id} novelTitle={novel.title} chapters={chapters} />
      </main>

      <Footer />

      {/* ========== 封面 lightbox ========== */}
      {showCoverLightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4
                     bg-black/80 backdrop-blur-sm"
          onClick={() => setShowCoverLightbox(false)}
        >
          {/* 關閉按鈕 */}
          <button
            onClick={() => setShowCoverLightbox(false)}
            className="absolute top-4 right-4 p-2 rounded-full
                       bg-white/10 text-white backdrop-blur-sm
                       hover:bg-white/20 transition-colors"
            aria-label="關閉"
          >
            <X className="w-6 h-6" />
          </button>

          <div
            className="max-h-[90vh] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            {isDefaultCover ? (
              <div className="aspect-[4/5] h-[85vh] rounded-lg shadow-2xl overflow-hidden">
                <DefaultCover
                  title={novel.title}
                  author={novel.author}
                  className="w-full h-full"
                />
              </div>
            ) : (
              <img
                src={novel.coverImage}
                alt={novel.title}
                className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
