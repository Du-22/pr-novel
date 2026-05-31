// ============================================
// 檔案名稱: chapters.js
// 路徑: src/firebase/chapters.js
// 用途: 章節 CRUD — metadata 存 Firestore 子集合 novels/{novelId}/chapters/{chapterNumber}，
//       content 存 Storage novels/{novelId}/chapters/{chapterNumber}.txt
//
// 子集合 metadata 欄位:
//   chapterNumber, title, wordCount, isSpecial, label, contentUrl, createdAt, updatedAt
// ============================================
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  orderBy,
  query,
  increment,
} from "firebase/firestore";
import { db } from "./config";
import {
  uploadChapterContent,
  fetchChapterContent,
  deleteChapterContent,
  deleteAllChaptersOfNovel,
  runWithConcurrency,
} from "./storageHelper";

const UPLOAD_CONCURRENCY = 10;

// 在 novel 主 doc 上維護的彙總欄位（列表頁不用查子集合就能顯示）
const updateNovelChapterStats = async (novelId, chapterCount, totalWordCount) => {
  await updateDoc(doc(db, "novels", novelId), {
    chapterCount,
    totalWordCount,
  });
};

// ========== 批量上傳章節（新小說上傳時使用）==========

/**
 * 把章節內文丟 Storage、metadata 寫 Firestore 子集合
 * 任何一章失敗 → 整本回滾（刪除已上傳的 Storage 檔案，使用者重試）
 *
 * @param {string} novelId
 * @param {Array} chapters - parser 產出的章節陣列（含 content）
 * @param {(done, total) => void} [onProgress]
 */
export const uploadChapters = async (novelId, chapters, onProgress, options = {}) => {
  if (!chapters || chapters.length === 0) return;
  const { volumeNumber = null } = options;

  // Step 1: 平行限流上傳 content 到 Storage，收集 contentUrl
  let uploadedCount = 0;
  let failed = false;

  const withUrls = await runWithConcurrency(
    chapters,
    UPLOAD_CONCURRENCY,
    async (chapter) => {
      if (failed) return null;
      try {
        const contentUrl = await uploadChapterContent(
          novelId,
          chapter.chapterNumber,
          chapter.content || ""
        );
        return { ...chapter, contentUrl };
      } catch (err) {
        failed = true;
        throw err;
      }
    },
    (done, total) => {
      uploadedCount = done;
      if (onProgress) onProgress(done, total);
    }
  ).catch(async (err) => {
    // 上傳失敗 → 回滾已上傳的 Storage 檔案
    console.error("章節上傳失敗，正在清理已上傳的檔案...", err);
    await deleteAllChaptersOfNovel(novelId);
    throw new Error(`章節上傳失敗（已上傳 ${uploadedCount}/${chapters.length}）: ${err.message}`);
  });

  // Step 2: metadata 寫 Firestore 子集合（batch）
  try {
    const BATCH_SIZE = 499;
    for (let i = 0; i < withUrls.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      const slice = withUrls.slice(i, i + BATCH_SIZE);
      slice.forEach((chapter) => {
        const chapterRef = doc(
          db,
          "novels",
          novelId,
          "chapters",
          String(chapter.chapterNumber)
        );
        const data = {
          chapterNumber: chapter.chapterNumber,
          title: chapter.title || "",
          wordCount: chapter.wordCount || 0,
          isSpecial: chapter.isSpecial || false,
          label: chapter.label || null,
          contentUrl: chapter.contentUrl,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        // 分卷小說章節記錄所屬卷;單卷小說(flat)不寫此欄位以維持相容
        if (volumeNumber != null) {
          data.volumeNumber = volumeNumber;
        }
        batch.set(chapterRef, data);
      });
      await batch.commit();
    }

    // 更新主 doc 上的彙總欄位（給列表頁用）
    const totalWordCount = withUrls.reduce(
      (sum, ch) => sum + (ch.wordCount || 0),
      0
    );
    await updateNovelChapterStats(novelId, withUrls.length, totalWordCount);

    console.log(`✅ ${withUrls.length} 個章節上傳成功`);
  } catch (err) {
    // Firestore metadata 寫入失敗 → 也要清掉 Storage 已上傳的檔案
    console.error("章節 metadata 寫入失敗，清理 Storage...", err);
    await deleteAllChaptersOfNovel(novelId);
    throw new Error(`章節 metadata 寫入失敗: ${err.message}`);
  }
};

// ========== 取得單一章節（含內容） ==========

/**
 * 從子集合拿 metadata → 從 Storage 拿 content
 * @returns {Promise<object|null>} - { chapterNumber, title, isSpecial, label, content, wordCount } 或 null
 */
export const getChapter = async (novelId, chapterNumber) => {
  const docRef = doc(db, "novels", novelId, "chapters", String(chapterNumber));
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;

  const metadata = docSnap.data();
  const content = await fetchChapterContent(metadata.contentUrl);
  return {
    id: docSnap.id,
    ...metadata,
    content,
  };
};

// ========== 取得所有章節 metadata（不含內容，用於目錄顯示） ==========

export const getChaptersMetadata = async (novelId) => {
  const q = query(
    collection(db, "novels", novelId, "chapters"),
    orderBy("chapterNumber", "asc")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
};

// ========== 新增單一章節 ==========

export const addChapter = async (novelId, chapterData) => {
  const { chapterNumber, content, title, isSpecial, label } = chapterData;
  const wordCount = (content || "").length;
  const contentUrl = await uploadChapterContent(
    novelId,
    chapterNumber,
    content || ""
  );
  const chapterRef = doc(
    db,
    "novels",
    novelId,
    "chapters",
    String(chapterNumber)
  );
  await setDoc(chapterRef, {
    chapterNumber,
    title: title || "",
    wordCount,
    isSpecial: isSpecial || false,
    label: label || null,
    contentUrl,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // 主 doc 彙總 +1 章 / + wordCount 字
  await updateDoc(doc(db, "novels", novelId), {
    chapterCount: increment(1),
    totalWordCount: increment(wordCount),
  });

  console.log(`✅ 章節 ${chapterNumber} 新增成功`);
};

// ========== 更新章節（標題 / 內容） ==========

/**
 * 更新章節。若 data.content 存在則同時更新 Storage；其餘欄位更新 Firestore
 */
export const updateChapter = async (novelId, chapterNumber, data) => {
  const chapterRef = doc(
    db,
    "novels",
    novelId,
    "chapters",
    String(chapterNumber)
  );

  const update = { ...data, updatedAt: serverTimestamp() };
  let wordCountDiff = 0;

  if (typeof data.content === "string") {
    // 內文更新 → 寫回 Storage（URL 不變）+ 算字數差
    const oldSnap = await getDoc(chapterRef);
    const oldWordCount = oldSnap.exists() ? oldSnap.data().wordCount || 0 : 0;
    const newWordCount = data.content.length;
    wordCountDiff = newWordCount - oldWordCount;

    await uploadChapterContent(novelId, chapterNumber, data.content);
    update.wordCount = newWordCount;
    delete update.content; // content 不存 Firestore
  }

  await updateDoc(chapterRef, update);

  if (wordCountDiff !== 0) {
    await updateDoc(doc(db, "novels", novelId), {
      totalWordCount: increment(wordCountDiff),
    });
  }

  console.log(`✅ 章節 ${chapterNumber} 更新成功`);
};

// ========== 刪除章節 ==========

export const deleteChapter = async (novelId, chapterNumber) => {
  const chapterRef = doc(
    db,
    "novels",
    novelId,
    "chapters",
    String(chapterNumber)
  );

  // 先抓 wordCount 才能反向 decrement 主 doc
  const snap = await getDoc(chapterRef);
  const wordCount = snap.exists() ? snap.data().wordCount || 0 : 0;

  await deleteChapterContent(novelId, chapterNumber);
  await deleteDoc(chapterRef);

  await updateDoc(doc(db, "novels", novelId), {
    chapterCount: increment(-1),
    totalWordCount: increment(-wordCount),
  });

  console.log(`✅ 章節 ${chapterNumber} 刪除成功`);
};
