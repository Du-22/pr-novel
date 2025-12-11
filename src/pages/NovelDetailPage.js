import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import NovelCard from "../components/NovelCard";
import { getAllNovels } from "../utils/novelsHelper";
import {
  parseNovelChapters,
  getTotalWordCount,
  formatWordCount,
} from "../utils/parser";
import { getNovelsByTag } from "../utils/random";
import { getBookmark } from "../utils/bookmarkManager";
import { getReadChapters } from "../utils/readHistoryManager";
import {
  initializeStats,
  getNovelStats,
  incrementViews,
  incrementFavorites,
  decrementFavorites,
} from "../utils/statsManager";
import {
  isFavorited as checkIsFavorited,
  addFavorite,
  removeFavorite,
} from "../utils/favoritesManager";

export default function NovelDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [novel, setNovel] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [similarNovels, setSimilarNovels] = useState([]);
  const [bookmark, setBookmark] = useState(null);
  const [stats, setStats] = useState({ views: 0, favorites: 0 });

  useEffect(() => {
    loadNovelData();
  }, [id, navigate]);

  const loadNovelData = () => {
    // 尋找小說 (支援 mockData + 上傳的小說)
    const allNovels = getAllNovels();
    const foundNovel = allNovels.find((n) => n.id === id);

    if (!foundNovel) {
      navigate("/");
      return;
    }
    setNovel(foundNovel);

    // 載入章節
    loadChapters(foundNovel);

    // 載入相似推薦 (同標籤的其他小說)
    loadSimilarNovels(foundNovel, allNovels);

    // 載入書籤 (localStorage)
    const savedBookmark = getBookmark(id);
    setBookmark(savedBookmark);

    // 載入統計數據並增加 views (每次進入都 +1)
    const currentStats = getNovelStats(id);
    const newViews = incrementViews(id);
    setStats({ ...currentStats, views: newViews });

    // 載入收藏狀態
    const favorited = checkIsFavorited(id);
    setIsFavorited(favorited);
  };

  // ========== 載入章節 ==========

  const loadChapters = async (novel) => {
    try {
      setLoading(true);

      // 如果是上傳的小說,直接使用 chapters
      if (novel.chapters) {
        setChapters(novel.chapters);
      }
      // 如果是 mockData 的小說,從 txtFile 載入
      else if (novel.txtFile) {
        const response = await fetch(novel.txtFile);
        const txtContent = await response.text();
        const parsedChapters = parseNovelChapters(txtContent);
        setChapters(parsedChapters);
      }
    } catch (error) {
      console.error("載入章節失敗:", error);
      setChapters([]);
    } finally {
      setLoading(false);
    }
  };

  // ========== 載入相似推薦 ==========

  const loadSimilarNovels = (currentNovel, allNovels) => {
    // 找出同標籤的小說
    const tag = currentNovel.tags[0]; // 取第一個標籤
    let similar = getNovelsByTag(allNovels, tag).filter(
      (n) => n.id !== currentNovel.id
    ); // 排除自己

    // 如果不夠 3 本,用其他標籤補
    if (similar.length < 3 && currentNovel.tags.length > 1) {
      const moreNovels = getNovelsByTag(allNovels, currentNovel.tags[1]).filter(
        (n) => n.id !== currentNovel.id && !similar.includes(n)
      );
      similar = [...similar, ...moreNovels];
    }

    // 最多取 3 本
    setSimilarNovels(similar.slice(0, 3));
  };

  // ========== 切換收藏 ==========

  const toggleFavorite = () => {
    if (isFavorited) {
      // 取消收藏
      removeFavorite(id);
      const newFavorites = decrementFavorites(id);
      setStats((prev) => ({ ...prev, favorites: newFavorites }));
      setIsFavorited(false);
    } else {
      // 加入收藏
      addFavorite(id);
      const newFavorites = incrementFavorites(id);
      setStats((prev) => ({ ...prev, favorites: newFavorites }));
      setIsFavorited(true);
    }
  };

  // ========== 開始閱讀/繼續閱讀 ==========

  const startReading = () => {
    if (chapters.length === 0) return;

    // 如果有書籤,跳到書籤位置
    if (bookmark && bookmark.chapter) {
      const chapterExists = chapters.find(
        (c) => c.chapterNumber === bookmark.chapter
      );
      if (chapterExists) {
        navigate(`/novel/${id}/read/${bookmark.chapter}`);
        return;
      }
    }

    // 沒有書籤,找出已讀章節
    const readChapterNumbers = getReadChapters(id);
    if (readChapterNumbers.length > 0) {
      // 找出最後讀過的章節
      const lastRead = Math.max(...readChapterNumbers);
      const nextChapter = lastRead + 1;

      // 如果全讀完了,從第一章重讀
      const targetChapter = chapters.find(
        (c) => c.chapterNumber === nextChapter
      )
        ? nextChapter
        : chapters[0].chapterNumber;

      navigate(`/novel/${id}/read/${targetChapter}`);
    } else {
      // 從第一章開始
      navigate(`/novel/${id}/read/${chapters[0].chapterNumber}`);
    }
  };

  // ========== 取得按鈕文字 ==========

  const getReadButtonText = () => {
    if (bookmark && bookmark.chapter) {
      // 找到章節標題
      const chapter = chapters.find(
        (c) => c.chapterNumber === bookmark.chapter
      );
      if (chapter) {
        return `繼續閱讀 (${chapter.title})`;
      }
      return `繼續閱讀 (第${bookmark.chapter}章)`;
    }

    const readChapterNumbers = getReadChapters(id);
    if (readChapterNumbers.length > 0) {
      return "繼續閱讀";
    }

    return "開始閱讀";
  };

  // ========== 檢查章節是否已讀 ==========

  const isChapterRead = (chapterNumber) => {
    const readChapterNumbers = getReadChapters(id);
    return readChapterNumbers.includes(chapterNumber);
  };

  if (!novel) return null;

  return (
    <div className="min-h-screen bg-light">
      <Navbar showBackButton={true} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* ========== 小說資訊區 ========== */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* 封面 */}
            <div className="flex-shrink-0">
              <img
                src={novel.coverImage}
                alt={novel.title}
                onClick={() => window.open(novel.coverImage, "_blank")}
                className="w-full md:w-64 h-80 object-cover rounded-lg shadow-lg cursor-pointer 
                         hover:opacity-90 transition-opacity"
              />
            </div>

            {/* 資訊 */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-dark mb-2 break-words">
                {novel.title}
              </h1>
              <p className="text-gray-600 mb-4">作者: {novel.author}</p>

              {/* 標籤 */}
              <div className="flex flex-wrap gap-2 mb-4">
                {novel.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-secondary/20 text-primary rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* 統計數字 */}
              <div className="flex gap-6 mb-4 text-gray-600">
                <div>
                  <span className="font-semibold text-dark">{stats.views}</span>{" "}
                  閱讀
                </div>
                <div>
                  <span className="font-semibold text-dark">
                    {stats.favorites}
                  </span>{" "}
                  收藏
                </div>
                <div>
                  <span className="font-semibold text-dark">
                    {chapters.length}
                  </span>{" "}
                  章節
                </div>
                <div>
                  <span className="font-semibold text-dark">
                    {formatWordCount(getTotalWordCount(chapters))}
                  </span>
                </div>
              </div>

              {/* 操作按鈕 */}
              <div className="flex gap-4">
                <button
                  onClick={startReading}
                  disabled={loading || chapters.length === 0}
                  className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 
                           transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed
                           font-semibold"
                >
                  {loading ? "載入中..." : getReadButtonText()}
                </button>

                {/* ⭐ 收藏按鈕 - 使用 Tailwind 紫色系 */}
                <button
                  onClick={toggleFavorite}
                  className={`px-6 py-3 rounded-lg border-2 transition-colors font-semibold
                    ${
                      isFavorited
                        ? "bg-primary text-white border-primary"
                        : "bg-white text-primary border-primary hover:bg-primary/10"
                    }`}
                >
                  {isFavorited ? "已收藏" : "加入收藏"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ========== 故事簡介 ========== */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-dark mb-4">故事簡介</h2>
          <p className="text-gray-700 leading-relaxed break-words">
            {novel.summary}
          </p>
        </div>

        {/* ========== 章節目錄 ========== */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-dark mb-4">章節目錄</h2>

          {loading ? (
            <p className="text-gray-500 text-center py-8">載入中...</p>
          ) : chapters.length === 0 ? (
            <p className="text-gray-500 text-center py-8">暫無章節</p>
          ) : (
            <div className="space-y-2">
              {chapters.map((chapter) => (
                <Link
                  key={chapter.chapterNumber}
                  to={`/novel/${id}/read/${chapter.chapterNumber}`}
                  className="block p-4 rounded-lg hover:bg-light transition-colors
                           border border-gray-200 hover:border-primary group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* 已讀標記 */}
                      {isChapterRead(chapter.chapterNumber) && (
                        <span className="text-primary text-lg">✓</span>
                      )}

                      {/* 章節標題 */}
                      <span
                        className={`font-medium group-hover:text-primary transition-colors break-words
                        ${chapter.isSpecial ? "text-primary" : "text-dark"}`}
                      >
                        {chapter.title}
                      </span>
                    </div>

                    {/* 字數 */}
                    <span className="text-sm text-gray-500">
                      {formatWordCount(chapter.wordCount)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ========== 你可能也喜歡 ========== */}
        {similarNovels.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-dark mb-4">你可能也喜歡</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {similarNovels.map((novel) => (
                <NovelCard key={novel.id} novel={novel} />
              ))}
            </div>
          </div>
        )}

        {/* ========== 讀者評論區 ========== */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-dark mb-4">讀者評論</h2>
          <p className="text-gray-500 text-center py-8">評論功能開發中...</p>
        </div>
      </div>
    </div>
  );
}
