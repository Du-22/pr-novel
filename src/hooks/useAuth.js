import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/config";
import { syncNovelsFromFirestore } from "../utils/uploadedNovelsManager";
import { saveUserProfile } from "../firebase/users";

/**
 * 登入狀態管理 Hook
 *
 * 使用方式:
 * const { user, loading } = useAuth();
 *
 * @returns {Object} { user, loading }
 * - user: 目前登入的使用者物件 (未登入則為 null)
 * - loading: 是否正在載入登入狀態
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 監聽登入狀態變化
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        if (currentUser) {
          // 使用者已登入
          if (process.env.NODE_ENV === "development") console.log("✅ 使用者已登入:", currentUser.email);
          setUser(currentUser);
          // 儲存使用者公開資料
          saveUserProfile(currentUser.uid, currentUser.displayName, currentUser.email).catch(() => {});
          // 登入後同步小說列表
          syncNovelsFromFirestore(currentUser.uid).catch((err) => console.error("登入後同步小說列表失敗:", err));
        } else {
          // 使用者未登入
          setUser(null);
        }
        setLoading(false);
      },
      (error) => {
        // 發生錯誤
        console.error("❌ Auth 狀態監聽錯誤:", error);
        setUser(null);
        setLoading(false);
      }
    );

    // 清理函式:元件卸載時取消監聽
    return () => unsubscribe();
  }, []);

  return { user, loading };
}
