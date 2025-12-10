const UPLOADED_NOVELS_KEY = "uploadedNovels";

// ========== 取得所有上傳的小說 ==========
export const getUploadedNovels = () => {
  const novels = localStorage.getItem(UPLOADED_NOVELS_KEY);
  return novels ? JSON.parse(novels) : [];
};

// ========== 儲存新的上傳小說 ==========
export const saveUploadedNovel = (novelData) => {
  const existingNovels = getUploadedNovels();

  // 生成唯一 ID
  const newId = `uploaded-${Date.now()}`;

  const newNovel = {
    id: newId,
    ...novelData,
    createdAt: new Date().toISOString(),
    stats: { views: 0, favorites: 0 },
    isTemp: true, // 標記為暫存
  };

  const updatedNovels = [...existingNovels, newNovel];
  localStorage.setItem(UPLOADED_NOVELS_KEY, JSON.stringify(updatedNovels));

  return newNovel;
};

// ========== 刪除上傳的小說 ==========
export const deleteUploadedNovel = (novelId) => {
  const existingNovels = getUploadedNovels();
  const updatedNovels = existingNovels.filter((n) => n.id !== novelId);
  localStorage.setItem(UPLOADED_NOVELS_KEY, JSON.stringify(updatedNovels));
};

// ========== 取得單本上傳的小說 ==========
export const getUploadedNovelById = (novelId) => {
  const novels = getUploadedNovels();
  return novels.find((n) => n.id === novelId);
};

// ========== 更新上傳的小說 ==========
export const updateUploadedNovel = (novelId, updatedData) => {
  const existingNovels = getUploadedNovels();
  const updatedNovels = existingNovels.map((novel) =>
    novel.id === novelId ? { ...novel, ...updatedData } : novel
  );
  localStorage.setItem(UPLOADED_NOVELS_KEY, JSON.stringify(updatedNovels));
};

// ========== 取得 localStorage 使用量 ==========
export const getStorageUsage = () => {
  let total = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length + key.length;
    }
  }

  const totalMB = (total / (1024 * 1024)).toFixed(2);
  const limitMB = 5; // 大多數瀏覽器限制 5MB
  const percentage = ((total / (limitMB * 1024 * 1024)) * 100).toFixed(1);

  return {
    used: totalMB,
    limit: limitMB,
    percentage: percentage,
  };
};
