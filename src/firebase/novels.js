import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { db } from "./config";

// ========== 上傳小說 ==========
export const uploadNovelToFirestore = async (novelData, userId) => {
  try {
    const docRef = await addDoc(collection(db, "novels"), {
      title: novelData.title,
      author: novelData.author,
      summary: novelData.summary,
      tags: novelData.tags,
      coverImage: novelData.coverImage,
      chapters: novelData.chapters,
      authorUid: userId,
      isOfficial: false,
      createdAt: serverTimestamp(),
      stats: { views: 0, favorites: 0 },
    });

    console.log("✅ 小說上傳成功，ID:", docRef.id);

    return {
      id: docRef.id, // ✅ Firebase 生成的 ID
      ...novelData,
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
export const deleteNovel = async (novelId, userId) => {
  const docRef = doc(db, "novels", novelId);

  // 檢查權限
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

  await deleteDoc(docRef);
  console.log("✅ 小說刪除成功");
};
