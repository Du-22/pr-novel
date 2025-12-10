// ========== 週數計算 ==========

/**
 * 計算今年第幾週
 * @returns {number} 週數
 */
export const getWeekNumber = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now - start;
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.floor(diff / oneWeek);
};

// ========== 隨機洗牌 ==========

/**
 * 使用種子的隨機洗牌(確保同一種子產生相同結果)
 * @param {Array} array - 要洗牌的陣列
 * @param {number} seed - 隨機種子
 * @returns {Array} 洗牌後的陣列
 */
export const seededShuffle = (array, seed) => {
  const arr = [...array];
  let currentSeed = seed;

  // 簡單的偽隨機數生成器
  const random = () => {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    return currentSeed / 233280;
  };

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

/**
 * 普通隨機洗牌(每次結果都不同)
 * @param {Array} array - 要洗牌的陣列
 * @returns {Array} 洗牌後的陣列
 */
export const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// ========== 標籤篩選 ==========

/**
 * 根據標籤篩選小說
 * @param {Array} novels - 小說陣列
 * @param {string} tag - 標籤名稱
 * @returns {Array} 符合標籤的小說
 */
export const getNovelsByTag = (novels, tag) => {
  return novels.filter((novel) => novel.tags.includes(tag));
};

// ========== 高階函式 ==========

/**
 * 取得每週隨機小說(同一週結果相同)
 * @param {Array} novels - 小說陣列
 * @param {number} count - 要取得的數量
 * @returns {Array} 隨機小說陣列
 */
export const getWeeklyRandomNovels = (novels, count = 6) => {
  const weekNum = getWeekNumber();
  return seededShuffle(novels, weekNum).slice(0, count);
};

/**
 * 取得隨機標籤區塊(每次執行結果都不同)
 * @param {Array} allTags - 所有標籤陣列
 * @param {Array} novels - 小說陣列
 * @param {number} sectionCount - 要生成幾個標籤區塊
 * @param {number} novelsPerSection - 每個區塊顯示幾本小說
 * @returns {Array} 標籤區塊陣列 [{title, novels}, ...]
 */
export const getRandomTagSections = (
  allTags,
  novels,
  sectionCount = 2,
  novelsPerSection = 3
) => {
  // 過濾掉沒有書的標籤
  const validTags = allTags.filter(
    (tag) => getNovelsByTag(novels, tag).length > 0
  );

  // 隨機選擇指定數量的標籤
  const shuffledTags = shuffleArray(validTags);
  const selectedTags = shuffledTags.slice(0, sectionCount);

  // 為每個標籤生成小說列表
  return selectedTags.map((tag) => ({
    title: tag,
    novels: shuffleArray(getNovelsByTag(novels, tag)).slice(
      0,
      novelsPerSection
    ),
  }));
};
