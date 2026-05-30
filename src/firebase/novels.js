import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  orderBy,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { db } from "./config";
import {
  deleteAllChaptersOfNovel,
  deleteCoverImage,
} from "./storageHelper";

// ========== 上傳小說 ==========
// 章節 metadata 不寫進這個 doc，改放子集合 novels/{id}/chapters
// 章節 content 不寫 Firestore，放 Storage novels/{id}/chapters/{n}.txt
export const uploadNovelToFirestore = async (novelData, userId) => {
  try {
    const docRef = await addDoc(collection(db, "novels"), {
      title: novelData.title,
      author: novelData.author,
      translator: novelData.translator || "",
      summary: novelData.summary,
      tags: novelData.tags,
      status: novelData.status || "serializing",
      coverImage: novelData.coverImage,
      authorUid: userId,
      uploaderName: novelData.uploaderName || "",
      isOfficial: false,
      createdAt: serverTimestamp(),
      stats: { views: 0, favorites: 0 },
    });

    console.log("✅ 小說上傳成功，ID:", docRef.id);

    return {
      ...novelData,
      id: docRef.id,
    };
  } catch (error) {
    console.error("❌ 上傳小說失敗:", error);
    throw error;
  }
};

// ========== 取得單本小說 ==========
export const getNovelById = async (novelId) => {
  const docRef = doc(db, "novels", novelId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data(),
    };
  }
  return null;
};

// ========== 取得所有小說 ==========
export const getAllNovels = async () => {
  const querySnapshot = await getDocs(collection(db, "novels"));
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

// ========== 取得使用者的小說 ==========
export const getUserNovels = async (userId) => {
  const q = query(
    collection(db, "novels"),
    where("authorUid", "==", userId)
  );

  const querySnapshot = await getDocs(q);
  const novels = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // 用 createdAt 降序排序（client-side，避免複合索引需求）
  novels.sort((a, b) => {
    const toDate = (val) => {
      if (!val) return new Date(0);
      if (typeof val.toDate === "function") return val.toDate();
      return new Date(val);
    };
    return toDate(b.createdAt) - toDate(a.createdAt);
  });

  return novels;
};

// ========== 取得官方小說 ==========
export const getOfficialNovels = async () => {
  const q = query(
    collection(db, "novels"),
    where("isOfficial", "==", true),
    orderBy("createdAt", "desc")
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

// ========== 更新小說 ==========
export const updateNovel = async (novelId, updateData, userId) => {
  const docRef = doc(db, "novels", novelId);

  // 檢查權限
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    throw new Error("小說不存在");
  }

  const novelData = docSnap.data();
  if (novelData.authorUid !== userId && !novelData.isOfficial) {
    throw new Error("沒有編輯權限");
  }

  await updateDoc(docRef, {
    ...updateData,
    updatedAt: serverTimestamp(),
  });

  console.log("✅ 小說更新成功");
};

// ========== 閱讀數 +1 ==========
export const incrementNovelViews = async (novelId) => {
  try {
    await updateDoc(doc(db, "novels", novelId), {
      "stats.views": increment(1),
    });
  } catch (error) {
    console.error("增加閱讀數失敗:", error);
  }
};

// ========== 收藏數 +1 / -1 ==========
export const incrementNovelFavorites = async (novelId) => {
  try {
    await updateDoc(doc(db, "novels", novelId), {
      "stats.favorites": increment(1),
    });
  } catch (error) {
    console.error("增加收藏數失敗:", error);
  }
};

export const decrementNovelFavorites = async (novelId) => {
  try {
    await updateDoc(doc(db, "novels", novelId), {
      "stats.favorites": increment(-1),
    });
  } catch (error) {
    console.error("減少收藏數失敗:", error);
  }
};

// ========== 刪除小說 ==========
// 連帶清除：Firestore 子集合 chapters / Storage 章節 txt / Storage 封面
export const deleteNovel = async (novelId, userId) => {
  const docRef = doc(db, "novels", novelId);

  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    throw new Error("小說不存在");
  }

  const novelData = docSnap.data();
  if (novelData.authorUid !== userId) {
    throw new Error("沒有刪除權限");
  }

  if (novelData.isOfficial) {
    throw new Error("官方小說無法刪除");
  }

  // 1. 清子集合 chapters（Firestore 不會自動刪子集合，要逐筆刪）
  try {
    const chaptersSnap = await getDocs(
      collection(db, "novels", novelId, "chapters")
    );
    const BATCH_SIZE = 499;
    const docs = chaptersSnap.docs;
    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      docs.slice(i, i + BATCH_SIZE).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  } catch (err) {
    console.warn("清子集合 chapters 失敗:", err.message);
  }

  // 2. 清 Storage 章節 txt
  await deleteAllChaptersOfNovel(novelId);

  // 3. 清封面（如果是 Storage URL 而非預設封面）
  if (
    novelData.coverImage &&
    typeof novelData.coverImage === "string" &&
    novelData.coverImage.includes("firebasestorage")
  ) {
    await deleteCoverImage(novelData.coverImage);
  }

  // 4. 刪 novel 主 doc
  await deleteDoc(docRef);
  console.log("✅ 小說刪除成功");
};
