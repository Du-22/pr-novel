// ========== 中文數字轉阿拉伯數字 ==========

/**
 * 將中文數字轉換為阿拉伯數字
 * @param {string} chineseNum - 中文數字 (例如: "二十一", "三十", "九十九")
 * @returns {number|null} - 轉換後的數字,失敗返回 null
 */
function parseChineseNumber(chineseNum) {
  const digitMap = {
    零: 0,
    〇: 0,
    一: 1,
    壹: 1,
    二: 2,
    貳: 2,
    两: 2,
    三: 3,
    參: 3,
    四: 4,
    肆: 4,
    五: 5,
    伍: 5,
    六: 6,
    陸: 6,
    七: 7,
    柒: 7,
    八: 8,
    捌: 8,
    九: 9,
    玖: 9,
  };

  const unitMap = {
    十: 10,
    拾: 10,
    百: 100,
    佰: 100,
    千: 1000,
    仟: 1000,
    万: 10000,
    萬: 10000,
  };

  // 移除空白
  chineseNum = chineseNum.trim();

  // 特殊情況: 「十」開頭 (例如: 十、十一、十五)
  if (chineseNum.startsWith("十") || chineseNum.startsWith("拾")) {
    if (chineseNum.length === 1) {
      return 10;
    }
    // 十X → 10 + X
    const rest = chineseNum.slice(1);
    if (digitMap[rest] !== undefined) {
      return 10 + digitMap[rest];
    }
  }

  let result = 0;
  let temp = 0;
  let lastIsDigit = false;

  for (let i = 0; i < chineseNum.length; i++) {
    const char = chineseNum[i];

    if (digitMap[char] !== undefined) {
      temp = digitMap[char];
      lastIsDigit = true;
    } else if (unitMap[char] !== undefined) {
      const unit = unitMap[char];

      if (temp === 0) {
        temp = 1; // 處理「十」= 1*10 的情況
      }

      if (unit >= 10000) {
        result = (result + temp) * unit;
        temp = 0;
      } else {
        temp *= unit;
        result += temp;
        temp = 0;
      }
      lastIsDigit = false;
    } else {
      // 遇到無法識別的字元
      return null;
    }
  }

  result += temp;
  return result > 0 ? result : null;
}

// ========== 解析章節標題 ==========

/**
 * 解析章節標題
 * @param {string} line - 要檢查的行
 * @returns {object|null} - {chapterNumber, title, isSpecial} 或 null
 */
function parseChapterTitle(line) {
  const trimmed = line.trim();

  // 1. 特殊章節: 序章/前言/楔子
  if (/^(序章|序|前言|楔子|prologue)/i.test(trimmed)) {
    return {
      chapterNumber: 0,
      title: trimmed,
      isSpecial: true,
    };
  }

  // 2. 特殊章節: 後記/尾聲/epilogue
  if (/^(後記|尾聲|epilogue)/i.test(trimmed)) {
    return {
      chapterNumber: 999,
      title: trimmed,
      isSpecial: true,
    };
  }

  // 3. 第X章 格式 (數字)
  const pattern1 = /^第(\d+)章[\s:：]*(.*)/;
  const match1 = trimmed.match(pattern1);
  if (match1) {
    return {
      chapterNumber: parseInt(match1[1]),
      title: match1[2] || `第${match1[1]}章`,
      isSpecial: false,
    };
  }

  // 4. 第X章 格式 (中文數字) - 使用新的解析器
  const pattern2 =
    /^第([一二三四五六七八九十零百千万萬壹貳參肆伍陸柒捌玖拾佰仟〇两]+)章[\s:：]*(.*)/;
  const match2 = trimmed.match(pattern2);
  if (match2) {
    const chineseNum = match2[1];
    const number = parseChineseNumber(chineseNum);
    if (number !== null) {
      return {
        chapterNumber: number,
        title: match2[2] || `第${chineseNum}章`,
        isSpecial: false,
      };
    }
  }

  // 5. Chapter X 格式
  const pattern3 = /^chapter\s+(\d+)[\s:：]*(.*)/i;
  const match3 = trimmed.match(pattern3);
  if (match3) {
    return {
      chapterNumber: parseInt(match3[1]),
      title: match3[2] || `Chapter ${match3[1]}`,
      isSpecial: false,
    };
  }

  // 6. 純數字開頭 (1. 標題)
  const pattern4 = /^(\d+)\.[\s]+(.*)/;
  const match4 = trimmed.match(pattern4);
  if (match4) {
    return {
      chapterNumber: parseInt(match4[1]),
      title: match4[2] || `第${match4[1]}章`,
      isSpecial: false,
    };
  }

  return null;
}

// ========== 解析小說章節 ==========

/**
 * 解析小說章節
 * @param {string} txtContent - 完整的 txt 內容
 * @returns {Array} - 章節陣列
 *
 * 回傳格式:
 * [{
 *   chapterNumber: 1,
 *   title: "開端",
 *   content: "章節內容...",
 *   isSpecial: false,
 *   wordCount: 3200
 * }]
 */
export function parseNovelChapters(txtContent) {
  if (!txtContent || txtContent.trim() === "") {
    return [];
  }

  const lines = txtContent.split("\n");
  const chapters = [];
  let currentChapter = null;
  let foundAnyChapter = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const chapterInfo = parseChapterTitle(line);

    if (chapterInfo) {
      foundAnyChapter = true;

      // 找到新章節,先保存上一章
      if (currentChapter) {
        currentChapter.content = currentChapter.content.trim();
        currentChapter.wordCount = currentChapter.content.length;
        chapters.push(currentChapter);
      }

      // 開始新章節
      currentChapter = {
        chapterNumber: chapterInfo.chapterNumber,
        title: chapterInfo.title,
        content: "",
        isSpecial: chapterInfo.isSpecial || false,
        wordCount: 0,
      };
    } else if (currentChapter) {
      // 累積章節內容
      currentChapter.content += line + "\n";
    }
  }

  // 保存最後一章
  if (currentChapter) {
    currentChapter.content = currentChapter.content.trim();
    currentChapter.wordCount = currentChapter.content.length;
    chapters.push(currentChapter);
  }

  // 如果沒有找到任何章節標記,視為單章
  if (chapters.length === 0) {
    return [
      {
        chapterNumber: 1,
        title: "正文",
        content: txtContent.trim(),
        isSpecial: false,
        wordCount: txtContent.trim().length,
      },
    ];
  }

  return chapters;
}

// ========== 計算總字數 ==========

/**
 * 計算總字數
 * @param {Array} chapters - 章節陣列
 * @returns {number} - 總字數
 */
export function getTotalWordCount(chapters) {
  return chapters.reduce((sum, chapter) => sum + chapter.wordCount, 0);
}

// ========== 格式化字數顯示 ==========

/**
 * 格式化字數顯示
 * @param {number} count - 字數
 * @returns {string} - 格式化後的字數 (例: "1.2萬字")
 */
export function formatWordCount(count) {
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)}萬字`;
  }
  return `${count}字`;
}
