// ============================================
// 檔案名稱: NovelDetailPage.js
// 路徑: src/pages/NovelDetailPage.js
// 用途: 小說詳情頁 — 封面 + 簡介 + 章節目錄 + 評分 + 收藏 + 相似推薦 + 留言
//       無封面時自動套用 DefaultCover,收藏按鈕用 warm accent (整體 design 的關鍵 accent moment)
// ============================================

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  BookOpen,
  Heart,
  Check,
  X,
  ChevronDown,
  Search,
  Share2,
  Copy,
  Mail,
  MessageCircle,
  MoreHorizontal,
} from "lucide-react";
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
import { formatChapterLabel, formatChapterLabelText } from "../utils/chapterLabel";
import { getChaptersMetadata } from "../firebase/chapters";
import { getNovelReadData, isChapterReadIn } from "../utils/readHistoryManager";
import {
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

// ========== 分卷模式專用：依 volumeNumber 分組 ==========
// 每組標題用 novel.volumes[].title(找不到時 fallback「卷 N」)
function groupChaptersByVolume(chapters, volumes) {
  if (!chapters || chapters.length === 0) return [];

  const byVol = new Map();
  chapters.forEach((ch) => {
    // 章節沒 volumeNumber 時當卷 1(防呆,正常分卷小說每章都會有)
    const vol = ch.volumeNumber ?? 1;
    if (!byVol.has(vol)) byVol.set(vol, []);
    byVol.get(vol).push(ch);
  });

  const sortedVols = [...byVol.keys()].sort((a, b) => a - b);
  return sortedVols.map((vol) => {
    const volInfo = volumes?.find((v) => v.volumeNumber === vol);
    const title = volInfo?.title || `卷 ${vol}`;
    return {
      key: `vol-${vol}`,
      label: title,
      coverImage: volInfo?.coverImage || null, // 卷封面 thumbnail(沒就 null)
      chapters: byVol.get(vol).sort((a, b) => a.chapterNumber - b.chapterNumber),
    };
  });
}

// ========== 單卷(flat)模式章節分組 helper ==========
// 依總章數動態決定分組大小；特別章節（cn > maxMain）獨立成一組「特別章節」放最後
function groupChapters(chapters) {
  if (!chapters || chapters.length === 0) return [];

  const maxMain = chapters
    .filter((c) => !c.isSpecial && c.chapterNumber > 0)
    .reduce((max, c) => Math.max(max, c.chapterNumber), 0);

  const mainAndPre = chapters.filter((c) => c.chapterNumber <= maxMain);
  const postSpecials = chapters.filter((c) => c.chapterNumber > maxMain);

  // 太少章節不分組
  if (chapters.length < 30) {
    return [{ key: "all", label: "全部章節", chapters }];
  }

  let groupSize;
  if (chapters.length < 100) groupSize = 20;
  else if (chapters.length < 500) groupSize = 50;
  else groupSize = 100;

  const groups = [];
  for (let start = 1; start <= maxMain; start += groupSize) {
    const end = Math.min(start + groupSize - 1, maxMain);
    const groupChs = mainAndPre.filter(
      (c) =>
        // 序章（cn=0）歸到第一組
        (c.chapterNumber === 0 && start === 1) ||
        (c.chapterNumber >= start && c.chapterNumber <= end)
    );
    if (groupChs.length > 0) {
      groups.push({
        key: `range-${start}-${end}`,
        label: `第 ${start}-${end} 章`,
        chapters: groupChs,
      });
    }
  }

  if (postSpecials.length > 0) {
    groups.push({
      key: "specials",
      label: "特別章節",
      chapters: postSpecials,
    });
  }

  return groups;
}

// 單筆章節 Link 渲染（分組模式跟搜尋模式共用）
// inGroup=true 時樣式調整為「分組內 list item」（無邊框、用 divider 分隔）
function renderChapterLink(chapter, novelId, isChapterRead, inGroup = false) {
  const { prefix, title } = formatChapterLabel(chapter);
  const baseCls = inGroup
    ? "flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-primary/5 dark:hover:bg-primary/10"
    : "group flex items-center justify-between p-3 sm:p-4 rounded-lg border transition-all border-neutral-200 hover:border-primary hover:bg-primary/5 dark:border-neutral-800 dark:hover:border-primary-light dark:hover:bg-primary/10";
  // 分卷章節走 /read/:vol/:ch,單卷沿用 /read/:ch
  const readPath =
    chapter.volumeNumber != null
      ? `/novel/${novelId}/read/${chapter.volumeNumber}/${chapter.chapterNumber}`
      : `/novel/${novelId}/read/${chapter.chapterNumber}`;
  // key 也要含 volume 避免不同卷同 chapterNumber 撞 React key
  const linkKey =
    chapter.volumeNumber != null
      ? `v${chapter.volumeNumber}-${chapter.chapterNumber}`
      : String(chapter.chapterNumber);
  return (
    <Link
      key={linkKey}
      to={readPath}
      className={baseCls}
    >
      <div className="flex items-center gap-3 min-w-0">
        {isChapterRead(chapter.chapterNumber, chapter.volumeNumber ?? null) && (
          <Check className="w-4 h-4 flex-shrink-0 text-primary dark:text-primary-light" />
        )}
        <span className="font-medium break-words transition-colors text-neutral-900 dark:text-neutral-100">
          <span className="text-neutral-400 dark:text-neutral-500 font-normal">
            {prefix}
            {title ? " - " : ""}
          </span>
          {title}
        </span>
      </div>
      <span className="flex-shrink-0 text-sm ml-3 text-neutral-500 dark:text-neutral-400">
        {formatWordCount(chapter.wordCount)}
      </span>
    </Link>
  );
}

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
  const [sameAuthorNovels, setSameAuthorNovels] = useState([]);
  const [readChapters, setReadChapters] = useState([]);
  const [lastChapter, setLastChapter] = useState(null);
  const [lastPage, setLastPage] = useState(null);
  const [lastVolume, setLastVolume] = useState(null); // 分卷小說才有
  const [stats, setStats] = useState({ views: 0, favorites: 0 });
  const [ratingStats, setRatingStats] = useState({ ratingSum: 0, ratingCount: 0 });
  const [userRating, setUserRating] = useState(null);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [showCoverLightbox, setShowCoverLightbox] = useState(false);
  const [chapterSearch, setChapterSearch] = useState("");
  const [openGroups, setOpenGroups] = useState(() => new Set());
  const [shareCopied, setShareCopied] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

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
    // 先算同作者,把這些 id 傳給「你可能也喜歡」排除,避免兩區塊撞書
    const sameAuthor = loadSameAuthorNovels(foundNovel, allNovels);
    loadSimilarNovels(
      foundNovel,
      allNovels,
      sameAuthor.map((n) => n.id)
    );

    const { readChapters: readChs, lastChapter: lastCh, lastPage: lastPg, lastVolume: lastVol } = await getNovelReadData(id);
    setReadChapters(readChs);
    setLastChapter(lastCh);
    setLastPage(lastPg);
    setLastVolume(lastVol);

    // 閱讀數改成「進入章節閱讀頁」才 +1(在 ReadingPage 處理),
    // 詳情頁不再自動 +1
    const freshNovel = await fetchNovelStats(id);
    const baseViews = freshNovel?.stats?.views ?? foundNovel.stats?.views ?? 0;
    const baseFavorites = freshNovel?.stats?.favorites ?? foundNovel.stats?.favorites ?? 0;
    setStats({ views: baseViews, favorites: baseFavorites });

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
      const chaptersMeta = await getChaptersMetadata(novel.id);
      setChapters(chaptersMeta);
    } catch (error) {
      console.error("載入章節失敗:", error);
      setChapters([]);
    } finally {
      setLoading(false);
    }
  };

  // 同作者作品:依 novel.author(真實作者名)比對,不是 authorUid(上傳者)
  // 依 createdAt 倒序最新最左,最多 3 本。回傳結果方便給「你可能也喜歡」排除用
  const loadSameAuthorNovels = (currentNovel, allNovels) => {
    if (!currentNovel.author) {
      setSameAuthorNovels([]);
      return [];
    }
    const sameAuthor = allNovels
      .filter(
        (n) => n.id !== currentNovel.id && n.author === currentNovel.author
      )
      .sort((a, b) => {
        const toMs = (val) => {
          if (!val) return 0;
          if (typeof val.toDate === "function") return val.toDate().getTime();
          return new Date(val).getTime();
        };
        return toMs(b.createdAt) - toMs(a.createdAt);
      })
      .slice(0, 3);
    setSameAuthorNovels(sameAuthor);
    return sameAuthor;
  };

  // 你可能也喜歡:按「共同 tag 數」降序排,取前 3 本。
  // 排除自己 + 已在同作者區塊出現的書(避免兩個區塊撞書)。
  // 至少要有 1 個共同 tag 才入選(零共同 tag 不算「相似」)。
  const loadSimilarNovels = (currentNovel, allNovels, excludeIds = []) => {
    const currentTags = new Set(currentNovel.tags || []);
    const excludeSet = new Set([currentNovel.id, ...excludeIds]);

    const scored = allNovels
      .filter((n) => !excludeSet.has(n.id))
      .map((n) => ({
        novel: n,
        score: (n.tags || []).filter((t) => currentTags.has(t)).length,
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);

    setSimilarNovels(scored.slice(0, 3).map((item) => item.novel));
  };

  const toggleFavorite = async () => {
    // 未登入直接跳到登入頁
    if (!user) {
      navigate("/auth");
      return;
    }
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

  const copyShareUrl = async (url) => {
    let copied = false;

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        copied = true;
      } catch (error) {
        copied = false;
      }
    }

    if (!copied) {
      const textArea = document.createElement("textarea");
      textArea.value = url;
      textArea.setAttribute("readonly", "");
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }

    setShareCopied(true);
    window.setTimeout(() => setShareCopied(false), 2000);
  };

  const getShareUrl = () => `${window.location.origin}/novel/${id}`;

  const getShareData = () => {
    const shareUrl = getShareUrl();
    return {
      title: `${novel.title} - PR 小說網`,
      text: `分享《${novel.title}》給你`,
      url: shareUrl,
    };
  };

  const handleNativeShare = async () => {
    const shareData = getShareData();

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        if (error.name === "AbortError") return;
      }
    }

    await copyShareUrl(shareData.url);
  };

  const openShareTarget = (url) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleShareNovel = () => {
    setShowShareDialog(true);
  };

  // 找上次讀的章節:分卷模式靠 (lastVolume, lastChapter),單卷靠 lastChapter
  const findLastChapter = () => {
    if (!lastChapter) return null;
    if (lastVolume != null) {
      return chapters.find(
        (c) => c.volumeNumber === lastVolume && c.chapterNumber === lastChapter
      ) || null;
    }
    return chapters.find((c) => c.chapterNumber === lastChapter) || null;
  };

  const startReading = () => {
    if (chapters.length === 0) return;
    const target = findLastChapter();
    if (target) {
      const base =
        target.volumeNumber != null
          ? `/novel/${id}/read/${target.volumeNumber}/${target.chapterNumber}`
          : `/novel/${id}/read/${target.chapterNumber}`;
      navigate(lastPage && lastPage > 1 ? `${base}?page=${lastPage}` : base);
      return;
    }
    // 沒記錄 → 跳第一章(也要考慮分卷)
    const first = chapters[0];
    const firstPath =
      first.volumeNumber != null
        ? `/novel/${id}/read/${first.volumeNumber}/${first.chapterNumber}`
        : `/novel/${id}/read/${first.chapterNumber}`;
    navigate(firstPath);
  };

  const getReadButtonText = () => {
    if (lastChapter) {
      const chapter = findLastChapter();
      if (chapter) return `繼續閱讀 (${formatChapterLabelText(chapter)})`;
      return `繼續閱讀 (第${lastChapter}章)`;
    }
    return "開始閱讀";
  };

  // 同時支援單卷(陣列)/ 分卷(物件)結構
  const isChapterRead = (chapterNumber, volumeNumber = null) =>
    isChapterReadIn(readChapters, chapterNumber, volumeNumber);

  // ========== 章節分組 + 搜尋 ==========
  const chapterGroups = useMemo(() => {
    // 分卷小說:依卷分組;單卷小說:沿用既有「20/50/100 章一組」邏輯
    if (novel?.volumeMode === "volumed") {
      return groupChaptersByVolume(chapters, novel.volumes);
    }
    return groupChapters(chapters);
  }, [chapters, novel?.volumeMode, novel?.volumes]);

  const filteredChapters = useMemo(() => {
    const q = chapterSearch.trim().toLowerCase();
    if (!q) return null;
    return chapters.filter((ch) => {
      const prefix = `第${ch.chapterNumber}章`;
      const title = (ch.title || "").toLowerCase();
      return prefix.toLowerCase().includes(q) || title.includes(q);
    });
  }, [chapters, chapterSearch]);

  // 預設展開：第一組 + 含目前閱讀章節的那組
  // 分卷小說要靠 (lastVolume, lastChapter) 才能準確定位
  useEffect(() => {
    if (chapterGroups.length === 0) return;
    const initial = new Set([chapterGroups[0].key]);
    if (lastChapter != null) {
      const currentGroup = chapterGroups.find((g) =>
        g.chapters.some((c) =>
          lastVolume != null
            ? c.volumeNumber === lastVolume && c.chapterNumber === lastChapter
            : c.chapterNumber === lastChapter
        )
      );
      if (currentGroup) initial.add(currentGroup.key);
    }
    setOpenGroups(initial);
  }, [chapterGroups, lastChapter, lastVolume]);

  const toggleGroup = (key) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };
  const expandAllGroups = () =>
    setOpenGroups(new Set(chapterGroups.map((g) => g.key)));
  const collapseAllGroups = () => setOpenGroups(new Set());

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
  const shareUrl = getShareUrl();
  const encodedShareUrl = encodeURIComponent(shareUrl);
  const encodedShareTitle = encodeURIComponent(`${novel.title} - PR 小說網`);
  const encodedShareText = encodeURIComponent(`分享《${novel.title}》給你`);
  const shareTargets = [
    {
      label: "複製連結",
      type: "copy",
      Icon: Copy,
      className: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200",
    },
    {
      label: "LINE",
      type: "external",
      Icon: MessageCircle,
      url: `https://social-plugins.line.me/lineit/share?url=${encodedShareUrl}`,
      className: "bg-[#06C755] text-white",
    },
    {
      label: "Facebook",
      type: "external",
      iconText: "f",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedShareUrl}`,
      className: "bg-[#1877F2] text-white",
    },
    {
      label: "X",
      type: "external",
      iconText: "X",
      url: `https://twitter.com/intent/tweet?text=${encodedShareText}&url=${encodedShareUrl}`,
      className: "bg-neutral-950 text-white dark:bg-neutral-100 dark:text-neutral-950",
    },
    {
      label: "Gmail",
      type: "external",
      Icon: Mail,
      url: `https://mail.google.com/mail/?view=cm&fs=1&su=${encodedShareTitle}&body=${encodedShareText}%0A${encodedShareUrl}`,
      className: "bg-danger-light text-danger",
    },
    {
      label: "Outlook",
      type: "external",
      Icon: Mail,
      url: `https://outlook.live.com/mail/0/deeplink/compose?subject=${encodedShareTitle}&body=${encodedShareText}%0A${encodedShareUrl}`,
      className: "bg-info-light text-info",
    },
    {
      label: "更多",
      type: "native",
      Icon: MoreHorizontal,
      className: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200",
    },
  ];

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
              {/* 標籤(可點,跳到標籤篩選頁) */}
              <div className="flex flex-wrap gap-2">
                {novel.tags.map((tag) => (
                  <Link
                    key={tag}
                    to={`/tags?tag=${encodeURIComponent(tag)}`}
                    className="px-2.5 py-0.5 text-xs rounded-full transition-colors
                               bg-neutral-100 text-neutral-700 hover:bg-primary/10 hover:text-primary
                               dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-primary/20 dark:hover:text-primary-light"
                  >
                    {tag}
                  </Link>
                ))}
              </div>

              {/* 標題 + 連載狀態 */}
              <div className="flex items-start gap-3 flex-wrap">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight break-words
                               text-neutral-900 dark:text-neutral-100">
                  {novel.title}
                </h1>
                {novel.status && (
                  <span
                    className={`flex-shrink-0 mt-2 text-xs px-2 py-1 rounded font-medium ${
                      novel.status === "completed"
                        ? "bg-info-light text-info"
                        : "bg-success-light text-success"
                    }`}
                  >
                    {novel.status === "completed" ? "完結" : "連載"}
                  </span>
                )}
              </div>

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

                <button
                  onClick={handleShareNovel}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border-2 font-semibold transition-all
                             border-neutral-300 text-neutral-700
                             hover:bg-neutral-50 hover:-translate-y-0.5 hover:shadow-md
                             dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
                  aria-live="polite"
                >
                  {shareCopied ? (
                    <Check className="w-5 h-5 text-success" />
                  ) : (
                    <Share2 className="w-5 h-5" />
                  )}
                  {shareCopied ? "已複製連結" : "分享"}
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
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight
                           text-neutral-900 dark:text-neutral-100">
              章節目錄
            </h2>
            {!loading && chapters.length > 0 && chapterGroups.length > 1 && !chapterSearch && (
              <div className="flex gap-2 text-sm">
                <button
                  type="button"
                  onClick={expandAllGroups}
                  className="px-3 py-1 rounded-md transition-colors
                             text-neutral-600 hover:text-primary hover:bg-primary/5
                             dark:text-neutral-400 dark:hover:text-primary-light dark:hover:bg-primary/10"
                >
                  展開全部
                </button>
                <button
                  type="button"
                  onClick={collapseAllGroups}
                  className="px-3 py-1 rounded-md transition-colors
                             text-neutral-600 hover:text-primary hover:bg-primary/5
                             dark:text-neutral-400 dark:hover:text-primary-light dark:hover:bg-primary/10"
                >
                  全部折疊
                </button>
              </div>
            )}
          </div>

          {/* 搜尋框 */}
          {!loading && chapters.length > 0 && (
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="search"
                value={chapterSearch}
                onChange={(e) => setChapterSearch(e.target.value)}
                placeholder="搜尋章節（編號或標題）..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm
                           bg-white text-neutral-900 placeholder-neutral-400 border-neutral-300
                           focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
                           dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500 dark:border-neutral-700"
              />
            </div>
          )}

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
          ) : filteredChapters !== null ? (
            // ===== 搜尋模式：扁平列表 =====
            <div className="space-y-2">
              {filteredChapters.length === 0 ? (
                <p className="text-center py-8 text-neutral-500 dark:text-neutral-400">
                  找不到符合「{chapterSearch}」的章節
                </p>
              ) : (
                filteredChapters.map((chapter) =>
                  renderChapterLink(chapter, id, isChapterRead)
                )
              )}
            </div>
          ) : (
            // ===== 分組折疊模式 =====
            <div className="space-y-2">
              {chapterGroups.map((group) => {
                const isOpen = openGroups.has(group.key);
                const readInGroup = group.chapters.filter((c) =>
                  isChapterRead(c.chapterNumber, c.volumeNumber ?? null)
                ).length;
                return (
                  <div
                    key={group.key}
                    className="rounded-lg border overflow-hidden
                               border-neutral-200 dark:border-neutral-800"
                  >
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.key)}
                      className="w-full flex items-center justify-between gap-3 px-4 py-3 transition-colors
                                 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <ChevronDown
                          className={`w-4 h-4 flex-shrink-0 transition-transform text-neutral-500
                                      ${isOpen ? "" : "-rotate-90"}`}
                        />
                        {/* 卷封面 thumbnail(只在分卷模式 + 該卷有上傳封面時顯示)*/}
                        {group.coverImage && (
                          <img
                            src={group.coverImage}
                            alt={group.label}
                            className="w-10 h-14 object-cover rounded flex-shrink-0
                                       border border-neutral-200 dark:border-neutral-700"
                          />
                        )}
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                          {group.label}
                        </span>
                      </div>
                      <span className="flex-shrink-0 text-sm text-neutral-500 dark:text-neutral-400">
                        {readInGroup > 0 && (
                          <span className="text-primary dark:text-primary-light">
                            {readInGroup}/{group.chapters.length}
                          </span>
                        )}
                        {readInGroup === 0 && `${group.chapters.length} 章`}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="border-t divide-y space-y-0
                                      border-neutral-200 divide-neutral-100
                                      dark:border-neutral-800 dark:divide-neutral-800">
                        {group.chapters.map((chapter) =>
                          renderChapterLink(chapter, id, isChapterRead, true)
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
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

        {/* ========== 同作者作品 ========== */}
        {sameAuthorNovels.length > 0 && (
          <section>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-4
                           text-neutral-900 dark:text-neutral-100">
              同作者作品
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {sameAuthorNovels.map((n) => (
                <NovelCard key={n.id} novel={n} />
              ))}
            </div>
          </section>
        )}

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

      {/* ========== 分享 dialog ========== */}
      {showShareDialog && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center
                     bg-neutral-950/60 backdrop-blur-sm
                     sm:items-center sm:p-4"
          onClick={() => setShowShareDialog(false)}
        >
          <div
            className="w-full max-h-[92vh] overflow-y-auto rounded-t-2xl border p-5 shadow-2xl
                       bg-white border-neutral-200
                       sm:max-w-lg sm:rounded-2xl sm:p-6
                       dark:bg-neutral-900 dark:border-neutral-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                  分享作品
                </h2>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  把這部小說推薦給朋友
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowShareDialog(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full transition-colors
                           text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900
                           dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
                aria-label="關閉分享視窗"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-5 flex gap-4 rounded-2xl border p-3
                            border-neutral-200 bg-neutral-50
                            dark:border-neutral-800 dark:bg-neutral-950">
              <div className="h-20 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
                {isDefaultCover ? (
                  <DefaultCover
                    title={novel.title}
                    author={novel.author}
                    className="h-full w-full"
                  />
                ) : (
                  <img
                    src={novel.coverImage}
                    alt={novel.title}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 font-semibold leading-snug text-neutral-900 dark:text-neutral-100">
                  {novel.title}
                </p>
                <p className="mt-1 truncate text-sm text-neutral-500 dark:text-neutral-400">
                  {novel.author}
                  {novel.translator ? ` · 譯者 ${novel.translator}` : ""}
                </p>
                {novel.status && (
                  <span
                    className={`mt-2 inline-flex rounded px-2 py-1 text-xs font-medium ${
                      novel.status === "completed"
                        ? "bg-info-light text-info"
                        : "bg-success-light text-success"
                    }`}
                  >
                    {novel.status === "completed" ? "完結" : "連載"}
                  </span>
                )}
              </div>
            </div>

            <div className="border-y py-5 border-neutral-200 dark:border-neutral-800">
              <p className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                分享
              </p>
              <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
                {shareTargets.map((target) => {
                  const Icon = target.Icon;
                  return (
                    <button
                      key={target.label}
                      type="button"
                      onClick={() => {
                        if (target.type === "copy") {
                          copyShareUrl(shareUrl);
                          return;
                        }
                        if (target.type === "native") {
                          handleNativeShare();
                          return;
                        }
                        openShareTarget(target.url);
                      }}
                      className="group flex w-20 flex-shrink-0 flex-col items-center gap-2"
                    >
                      <span
                        className={`flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold transition-transform
                                    group-hover:-translate-y-0.5 ${target.className}`}
                      >
                        {Icon ? <Icon className="h-6 w-6" /> : target.iconText}
                      </span>
                      <span className="w-full truncate text-center text-xs font-medium text-neutral-700 dark:text-neutral-300">
                        {target.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2 rounded-xl border p-2
                            border-neutral-200 bg-neutral-50
                            dark:border-neutral-800 dark:bg-neutral-950">
              <input
                readOnly
                value={shareUrl}
                className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm
                           text-neutral-700 outline-none
                           dark:text-neutral-200"
                aria-label="分享連結"
              />
              <button
                type="button"
                onClick={() => copyShareUrl(shareUrl)}
                className="inline-flex h-10 flex-shrink-0 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors
                           bg-neutral-900 text-white hover:bg-neutral-700
                           dark:bg-neutral-100 dark:text-neutral-950 dark:hover:bg-neutral-300"
              >
                {shareCopied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {shareCopied ? "已複製" : "複製"}
              </button>
            </div>
          </div>
        </div>
      )}

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
