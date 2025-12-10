/**
 * 壓縮圖片
 * @param {File} file - 圖片檔案
 * @param {number} maxWidth - 最大寬度 (預設 400px)
 * @param {number} quality - 壓縮品質 (0-1,預設 0.7)
 * @returns {Promise<string>} base64 字串
 */
export const compressImage = (file, maxWidth = 400, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("請上傳圖片檔案"));
      return;
    }

    const reader = new FileReader();

    reader.onerror = () => reject(new Error("讀取檔案失敗"));

    reader.onload = (e) => {
      const img = new Image();

      img.onerror = () => reject(new Error("圖片載入失敗"));

      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          // 計算縮放比例
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          // 繪製圖片
          ctx.drawImage(img, 0, 0, width, height);

          // 轉成 base64
          const compressed = canvas.toDataURL("image/jpeg", quality);
          resolve(compressed);
        } catch (error) {
          reject(error);
        }
      };

      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
  });
};

/**
 * 估算 base64 字串大小 (MB)
 * @param {string} base64 - base64 字串
 * @returns {number} 大小 (MB)
 */
export const getBase64Size = (base64) => {
  const sizeInBytes = (base64.length * 3) / 4;
  return (sizeInBytes / (1024 * 1024)).toFixed(2);
};
