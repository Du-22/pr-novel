// ============================================
// 檔案名稱: useUnreadNotifications.js
// 路徑: src/hooks/useUnreadNotifications.js
// 用途: 即時監聽未讀通知數量（onSnapshot）
// ============================================
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./useAuth";

export function useUnreadNotifications() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const q = query(
      collection(db, "notifications", user.uid, "items"),
      where("read", "==", false)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => setUnreadCount(snapshot.size),
      (err) => console.error("通知監聽失敗:", err)
    );

    return () => unsubscribe();
  }, [user]);

  return unreadCount;
}
