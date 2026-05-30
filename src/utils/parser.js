// ============================================
// 檔案名稱: parser.js
// 路徑: src/utils/parser.js
// 用途: TXT 章節解析 — 將整本小說 txt 拆成章節陣列
//
// 回傳格式:
// [{
//   chapterNumber: 1,           // 阿拉伯數字章節編號（特殊章節用 6 位數，見下）
//   title: "魔法彩筆入學考",      // 純副標題（沒副標時 fallback 為整行原文）
//   isSpecial: false,           // 是否為特殊章節（序章/番外/終章/後記）
//   label: null,                // 特殊章節顯示前綴（例：「序章」「番外一」），一般章節為 null
//   content: "章節內容...",
//   wordCount: 3200,
// }]
//
// 特殊章節 chapterNumber 配置（讓 sort 自然落到正確位置）:
//   - 序章 / 楔子 / 前言 / 引子: 0
//   - 正文: 1 ~ N
//   - 番外 / 外傳 / 特別篇: 900000, 900001, 900002, ...（按出現順序遞增）
//   - 終章: 999998
//   - 後記 / 尾聲: 999999
// ============================================

// ========== 中文數字轉阿拉伯數字 ==========

function parseChineseNumber(chineseNum) {
  const digitMap = {
    零: 0, 〇: 0,
    一: 1, 壹: 1,
    二: 2, 貳: 2, 两: 2, 兩: 2,
    三: 3, 參: 3,
    四: 4, 肆: 4,
    五: 5, 伍: 5,
    六: 6, 陸: 6,
    七: 7, 柒: 7,
    八: 8, 捌: 8,
    九: 9, 玖: 9,
  };

  const unitMap = {
    十: 10, 拾: 10,
    百: 100, 佰: 100,
    千: 1000, 仟: 1000,
    万: 10000, 萬: 10000,
  };

  chineseNum = chineseNum.trim();

  if (chineseNum.startsWith("十") || chineseNum.startsWith("拾")) {
    if (chineseNum.length === 1) return 10;
    const rest = chineseNum.slice(1);
    if (digitMap[rest] !== undefined) return 10 + digitMap[rest];
  }

  let result = 0;
  let temp = 0;

  for (let i = 0; i < chineseNum.length; i++) {
    const char = chineseNum[i];

    if (digitMap[char] !== undefined) {
      temp = digitMap[char];
    } else if (unitMap[char] !== undefined) {
      const unit = unitMap[char];
      if (temp === 0) temp = 1;
      if (unit >= 10000) {
        result = (result + temp) * unit;
        temp = 0;
      } else {
        temp *= unit;
        result += temp;
        temp = 0;
      }
    } else {
      return null;
    }
  }

  result += temp;
  return result > 0 ? result : null;
}

const CHINESE_NUM_CHARS = "一二三四五六七八九十零百千万萬壹貳參肆伍陸柒捌玖拾佰仟〇两兩";

// ========== 特殊章節編號常數 ==========

const PRE_CHAPTER_NUMBER = 0;          // 序章/楔子/前言/引子
const EXTRA_CHAPTER_BASE = 900000;     // 番外起始號（之後 +index）
const GENERIC_HEADING_BASE = 990000;   // markdown # heading 不像章節時的起始號（之後 +index）
const FINALE_CHAPTER_NUMBER = 999998;  // 終章
const POST_CHAPTER_NUMBER = 999999;    // 後記/尾聲

// ========== 一般章節副標 → 特殊章節覆寫 ==========
// 處理「第787章 後記」這種把特殊章節當成編號章節寫法的情況
// 只在副標**完全等於**特殊關鍵字時才重歸（避免「兵變後記」被誤判）
function tryOverrideAsSpecial(subtitle, extraCount) {
  if (!subtitle) return null;
  const s = subtitle.trim();

  if (/^(序章|序|前言|楔子|引子|引言|緣起|prologue)$/i.test(s)) {
    return { chapterNumber: PRE_CHAPTER_NUMBER, title: s, isSpecial: true };
  }
  if (/^(番外|外傳|特別篇)[一二三四五六七八九十零百千〇\d]*$/.test(s)) {
    return {
      chapterNumber: EXTRA_CHAPTER_BASE + extraCount,
      title: s,
      isSpecial: true,
    };
  }
  if (s === "終章") {
    return { chapterNumber: FINALE_CHAPTER_NUMBER, title: s, isSpecial: true };
  }
  if (/^(後記|尾聲|作者後記|譯者後記|epilogue)$/i.test(s)) {
    return { chapterNumber: POST_CHAPTER_NUMBER, title: s, isSpecial: true };
  }
  return null;
}

// ========== 解析章節標題 ==========

/**
 * 解析章節標題
 * @param {string} line - 要檢查的行
 * @param {number} extraCount - 目前已解析過的番外數量（用於遞增番外編號）
 * @param {boolean} allowLooseNumDot - 是否啟用「1. 標題」這條鬆規則（檔案沒其他章節標記時才開）
 * @returns {object|null} - { chapterNumber, title, isSpecial, label } 或 null
 *
 * 設計原則:
 *   - 一般章節: 剝離編號前綴後的副標放 title；沒副標時 fallback 用整行原文
 *   - 特殊章節: title 剝乾淨只留副標（沒副標就空字串），label 放灰色前綴用標籤
 *   - chapterNumber 統一存阿拉伯數字
 */
function parseChapterTitle(line, extraCount, genericCount, allowLooseNumDot) {
  const trimmed = line.trim();

  // ===== Markdown heading（# / ## / ... + 空白 + 內容） =====
  // 先剝掉 # 跟空白，內部文字再走一般章節規則；不符任何規則就當通用 special heading
  const mdHeadingMatch = trimmed.match(/^#{1,6}\s+(.+)$/);
  if (mdHeadingMatch) {
    const inner = mdHeadingMatch[1].trim();
    const innerParsed = parseChapterTitleNoMd(inner, extraCount, allowLooseNumDot);
    if (innerParsed) return innerParsed;
    return {
      chapterNumber: GENERIC_HEADING_BASE + genericCount,
      title: inner,
      isSpecial: true,
      label: inner,
    };
  }

  return parseChapterTitleNoMd(trimmed, extraCount, allowLooseNumDot);
}

// 不含 markdown heading 的章節規則（給 parseChapterTitle 跟 recursive 內部呼叫用）
function parseChapterTitleNoMd(trimmed, extraCount, allowLooseNumDot) {
  // ===== 特殊章節（序章類） =====
  // title 不剝 keyword，整行原文當 title（保留「序章」字樣的視覺暗示）
  if (/^(序章|序|前言|楔子|引子|引言|緣起|prologue)(?:[\s:：].*)?$/i.test(trimmed)) {
    return {
      chapterNumber: PRE_CHAPTER_NUMBER,
      title: trimmed,
      isSpecial: true,
    };
  }

  // ===== 特殊章節（番外類） =====
  if (
    /^(番外|外傳|特別篇)\s*[一二三四五六七八九十零百千〇\d]*(?:[\s:：].*)?$/.test(trimmed)
  ) {
    return {
      chapterNumber: EXTRA_CHAPTER_BASE + extraCount,
      title: trimmed,
      isSpecial: true,
    };
  }

  // ===== 特殊章節（終章） =====
  if (/^終章(?:[\s:：].*)?$/.test(trimmed)) {
    return {
      chapterNumber: FINALE_CHAPTER_NUMBER,
      title: trimmed,
      isSpecial: true,
    };
  }

  // ===== 特殊章節（後記類）— 含作者後記/譯者後記 =====
  if (/^(後記|尾聲|作者後記|譯者後記|epilogue)(?:[\s:：].*)?$/i.test(trimmed)) {
    return {
      chapterNumber: POST_CHAPTER_NUMBER,
      title: trimmed,
      isSpecial: true,
    };
  }

  // ===== 一般章節 =====
  // 一般章節 fallback title 用整行原文，不用空字串
  const fallbackTitle = trimmed;

  // 把匹配結果包成統一處理：
  //   - 副標為特殊關鍵字時 → 轉特殊章節
  //   - chapterNumber < 1 → 視為非章節（一般章節最小是 1，0 號保留給序章）
  const buildRegular = (numStr, rawSubtitle) => {
    const chapterNumber = parseInt(numStr, 10);
    if (chapterNumber < 1) return null;
    const subtitle = (rawSubtitle || "").trim();
    const override = tryOverrideAsSpecial(subtitle, extraCount);
    if (override) return override;
    return {
      chapterNumber,
      title: subtitle || fallbackTitle,
      isSpecial: false,
      label: null,
    };
  };

  // 第X章/節/話/卷/回（阿拉伯數字）
  // 單位字後必須接空白/冒號/行尾，避免「第1回合」「第3節日」這類複合詞被誤判
  const arabicMatch = trimmed.match(/^第(\d+)[章節話卷回](?=[\s:：]|$)[\s:：]*(.*)$/);
  if (arabicMatch) {
    return buildRegular(arabicMatch[1], arabicMatch[2]);
  }

  // 第X章/節/話/卷/回（中文數字）
  const chineseMatch = trimmed.match(
    new RegExp(`^第([${CHINESE_NUM_CHARS}]+)[章節話卷回](?=[\\s:：]|$)[\\s:：]*(.*)$`)
  );
  if (chineseMatch) {
    const num = parseChineseNumber(chineseMatch[1]);
    if (num !== null && num >= 1) {
      const subtitle = chineseMatch[2].trim();
      const override = tryOverrideAsSpecial(subtitle, extraCount);
      if (override) return override;
      return {
        chapterNumber: num,
        title: subtitle || fallbackTitle,
        isSpecial: false,
        label: null,
      };
    }
  }

  // X章/節/話/卷/回（沒「第」前綴的阿拉伯數字）
  const arabicNoPrefixMatch = trimmed.match(/^(\d+)[章節話卷回](?=[\s:：]|$)[\s:：]*(.*)$/);
  if (arabicNoPrefixMatch) {
    return buildRegular(arabicNoPrefixMatch[1], arabicNoPrefixMatch[2]);
  }

  // Chapter X
  const chapterEnMatch = trimmed.match(/^chapter\s+(\d+)[\s:：]*(.*)$/i);
  if (chapterEnMatch) {
    return buildRegular(chapterEnMatch[1], chapterEnMatch[2]);
  }

  // 行首特殊符號（◆◇◈●○★☆※▼▽▲△■□等）+ 空白 + 數字 + . 或空白 + 標題
  // 例: 「◈ 145. [STAGE 5] 吸血王 (2)」
  const symbolMatch = trimmed.match(
    /^[◆◇◈●○★☆※▼▽▲△■□]\s*(\d+)[.．\s]\s*(.*)$/
  );
  if (symbolMatch) {
    return buildRegular(symbolMatch[1], symbolMatch[2]);
  }

  // 純數字開頭（1. 標題）
  // 這條規則很容易誤判正文中的編號列表。
  // 只在檔案沒任何「第N章/Chapter N/◈ N」標記時才啟用（純 1.格式 的小說）。
  if (allowLooseNumDot) {
    const numDotMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numDotMatch) {
      return buildRegular(numDotMatch[1], numDotMatch[2]);
    }
  }

  return null;
}

// 預掃：檔案是否包含結構化章節標記（第N章、Chapter N、符號+數字）
// 單位字後須接空白/冒號/行尾，避免「第1回合」「3節日」這類詞被誤認
function hasStructuredChapterMarkers(txtContent) {
  return /(^|\n)\s*(第[\d一二三四五六七八九十零百千万萬壹貳參肆伍陸柒捌玖拾佰仟〇两兩]+[章節話卷回](?=[\s:：]|$|\n)|chapter\s+\d+|[◆◇◈●○★☆※▼▽▲△■□]\s*\d+|\d+[章節話卷回](?=[\s:：]|$|\n)|#{1,6}\s+\S)/i.test(
    txtContent
  );
}

// ========== 解析小說章節 ==========

export function parseNovelChapters(txtContent) {
  if (!txtContent || txtContent.trim() === "") return [];

  const lines = txtContent.split("\n");
  const chapters = [];
  let currentChapter = null;
  let extraCount = 0;
  let genericCount = 0;

  // 檔案有結構化標記時，關掉「1. 標題」鬆規則，避免誤判正文中的編號列表
  const allowLooseNumDot = !hasStructuredChapterMarkers(txtContent);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const chapterInfo = parseChapterTitle(line, extraCount, genericCount, allowLooseNumDot);

    if (chapterInfo) {
      if (chapterInfo.label && /^番外|^外傳|^特別篇/.test(chapterInfo.label)) {
        extraCount += 1;
      }
      if (
        chapterInfo.chapterNumber >= GENERIC_HEADING_BASE &&
        chapterInfo.chapterNumber < FINALE_CHAPTER_NUMBER
      ) {
        genericCount += 1;
      }

      if (currentChapter) {
        currentChapter.content = currentChapter.content.trim();
        currentChapter.wordCount = currentChapter.content.length;
        chapters.push(currentChapter);
      }

      currentChapter = {
        chapterNumber: chapterInfo.chapterNumber,
        title: chapterInfo.title,
        isSpecial: chapterInfo.isSpecial,
        label: chapterInfo.label,
        content: "",
        wordCount: 0,
      };
    } else if (currentChapter) {
      currentChapter.content += line + "\n";
    }
  }

  if (currentChapter) {
    currentChapter.content = currentChapter.content.trim();
    currentChapter.wordCount = currentChapter.content.length;
    chapters.push(currentChapter);
  }

  // 沒找到任何章節標記 → 視為單章
  if (chapters.length === 0) {
    return [
      {
        chapterNumber: 1,
        title: "正文",
        isSpecial: false,
        label: null,
        content: txtContent.trim(),
        wordCount: txtContent.trim().length,
      },
    ];
  }

  // 把特殊章節從固定大數字（900000+/990000+/999998/999999）重新編號成
  // 「正文最後一章 + 1, +2, +3 ...」順序：終章 → 後記 → 通用 # → 番外
  renumberSpecialChapters(chapters);

  return chapters;
}

function renumberSpecialChapters(chapters) {
  const maxMain = chapters
    .filter((c) => c.chapterNumber >= 1 && c.chapterNumber < EXTRA_CHAPTER_BASE)
    .reduce((max, c) => Math.max(max, c.chapterNumber), 0);

  // 依當前 chapterNumber 分類（filter 保留 array 順序 = file 順序）
  const finale = chapters.filter((c) => c.chapterNumber === FINALE_CHAPTER_NUMBER);
  const post = chapters.filter((c) => c.chapterNumber === POST_CHAPTER_NUMBER);
  const generic = chapters.filter(
    (c) =>
      c.chapterNumber >= GENERIC_HEADING_BASE &&
      c.chapterNumber < FINALE_CHAPTER_NUMBER
  );
  const extra = chapters.filter(
    (c) =>
      c.chapterNumber >= EXTRA_CHAPTER_BASE &&
      c.chapterNumber < GENERIC_HEADING_BASE
  );

  let cursor = maxMain + 1;
  finale.forEach((c) => { c.chapterNumber = cursor++; });
  post.forEach((c) => { c.chapterNumber = cursor++; });
  generic.forEach((c) => { c.chapterNumber = cursor++; });
  extra.forEach((c) => { c.chapterNumber = cursor++; });
}

// ========== 計算總字數 ==========

export function getTotalWordCount(chapters) {
  return chapters.reduce((sum, chapter) => sum + chapter.wordCount, 0);
}

// ========== 格式化字數顯示 ==========

export function formatWordCount(count) {
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)}萬字`;
  }
  return `${count}字`;
}
