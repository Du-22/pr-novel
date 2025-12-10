const STATS_KEY = "novelStats";

// ========== 初始化統計數據 ==========
// 從 mockData 載入初始數據 (只在第一次執行)
export const initializeStats = (mockNovels) => {
  const existing = localStorage.getItem(STATS_KEY);
  if (existing) return; // 已經初始化過了,不重複執行

  const initialStats = {};
  mockNovels.forEach((novel) => {
    initialStats[novel.id] = {
      views: novel.stats?.views || 0,
      favorites: novel.stats?.favorites || 0,
    };
  });

  localStorage.setItem(STATS_KEY, JSON.stringify(initialStats));
};

// ========== 取得所有統計數據 ==========
export const getAllStats = () => {
  const stats = localStorage.getItem(STATS_KEY);
  return stats ? JSON.parse(stats) : {};
};

// ========== 取得單本小說統計 ==========
export const getNovelStats = (novelId) => {
  const allStats = getAllStats();
  return allStats[novelId] || { views: 0, favorites: 0 };
};

// ========== 增加閱讀數 (views +1) ==========
export const incrementViews = (novelId) => {
  const allStats = getAllStats();

  if (!allStats[novelId]) {
    allStats[novelId] = { views: 0, favorites: 0 };
  }

  allStats[novelId].views += 1;
  localStorage.setItem(STATS_KEY, JSON.stringify(allStats));

  return allStats[novelId].views;
};

// ========== 增加收藏數 (favorites +1) ==========
export const incrementFavorites = (novelId) => {
  const allStats = getAllStats();

  if (!allStats[novelId]) {
    allStats[novelId] = { views: 0, favorites: 0 };
  }

  allStats[novelId].favorites += 1;
  localStorage.setItem(STATS_KEY, JSON.stringify(allStats));

  return allStats[novelId].favorites;
};

// ========== 減少收藏數 (favorites -1) ==========
export const decrementFavorites = (novelId) => {
  const allStats = getAllStats();

  if (!allStats[novelId]) {
    allStats[novelId] = { views: 0, favorites: 0 };
  }

  allStats[novelId].favorites = Math.max(0, allStats[novelId].favorites - 1);
  localStorage.setItem(STATS_KEY, JSON.stringify(allStats));

  return allStats[novelId].favorites;
};

// ========== 取得排行榜數據 (合併 mockData + localStorage) ==========
export const getRankingData = (mockNovels, sortBy = "views", limit = null) => {
  const allStats = getAllStats();

  // 合併 mockData 和 localStorage 數據
  const novelsWithStats = mockNovels.map((novel) => {
    const stats = allStats[novel.id] || {
      views: novel.stats?.views || 0,
      favorites: novel.stats?.favorites || 0,
    };

    return {
      ...novel,
      stats: {
        views: stats.views,
        favorites: stats.favorites,
      },
    };
  });

  // 根據排序方式排序
  let sorted = [...novelsWithStats];

  switch (sortBy) {
    case "views":
      sorted.sort((a, b) => b.stats.views - a.stats.views);
      break;
    case "favorites":
      sorted.sort((a, b) => b.stats.favorites - a.stats.favorites);
      break;
    case "new":
      sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      break;
    default:
      break;
  }

  // 如果有限制數量,只回傳前 N 名
  return limit ? sorted.slice(0, limit) : sorted;
};
