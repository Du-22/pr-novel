// ============================================
// 檔案名稱: chapters.js
// 路徑: src/firebase/chapters.js
// 用途: 章節子集合 CRUD（novels/{novelId}/chapters/{chapterNumber}）
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
} from "firebase/firestore";
import { db } from "./config";

// ========== 批量上傳章節（新小說上傳時使用）==========
export const uploadChapters = async (novelId, chapters) => {
  const BATCH_SIZE = 499;

  for (let i = 0; i < chapters.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    const slice = chapters.slice(i, i + BATCH_SIZE);

    slice.forEach((chapter) => {
      const chapterRef = doc(
        db,
        "novels",
        novelId,
        "chapters",
        String(chapter.chapterNumber)
      );
      batch.set(chapterRef, {
        chapterNumber: chapter.chapterNumber,
        title: chapter.title,
        content: chapter.content || "",
        wordCount: chapter.wordCount || 0,
        isSpecial: chapter.isSpecial || false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });

    await batch.commit();
  }

  console.log(`✅ ${chapters.length} 個章節上傳成功`);
};

// ========== 取得單一章節（含內容）==========
export const getChapter = async (novelId, chapterNumber) => {
  const docRef = doc(
    db,
    "novels",
    novelId,
    "chapters",
    String(chapterNumber)
  );
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
};

// ========== 取得所有章節 metadata（不含內容，用於目錄顯示）==========
export const getChaptersMetadata = async (novelId) => {
  const q = query(
    collection(db, "novels", novelId, "chapters"),
    orderBy("chapterNumber", "asc")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((docSnap) => {
    const { content, ...metadata } = docSnap.data(); // eslint-disable-line no-unused-vars
    return { id: docSnap.id, ...metadata };
  });
};

// ========== 新增單一章節 ==========
export const addChapter = async (novelId, chapterData) => {
  const chapterRef = doc(
    db,
    "novels",
    novelId,
    "chapters",
    String(chapterData.chapterNumber)
  );
  await setDoc(chapterRef, {
    chapterNumber: chapterData.chapterNumber,
    title: chapterData.title,
    content: chapterData.content || "",
    wordCount: chapterData.wordCount || chapterData.content?.length || 0,
    isSpecial: chapterData.isSpecial || false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  console.log(`✅ 章節 ${chapterData.chapterNumber} 新增成功`);
};

// ========== 更新章節（標題 / 內容）==========
export const updateChapter = async (novelId, chapterNumber, data) => {
  const chapterRef = doc(
    db,
    "novels",
    novelId,
    "chapters",
    String(chapterNumber)
  );
  await updateDoc(chapterRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
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
  await deleteDoc(chapterRef);
  console.log(`✅ 章節 ${chapterNumber} 刪除成功`);
};
