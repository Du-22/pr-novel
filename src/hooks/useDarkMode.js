// ============================================
// 檔案名稱: useDarkMode.js
// 路徑: src/hooks/useDarkMode.js
// 用途: 日間 / 夜間模式切換 hook,讀寫 localStorage,
//       首次進站若無記錄則跟隨系統 prefers-color-scheme
// ============================================

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "pr-novel-theme";

const getInitialTheme = () => {
  if (typeof window === "undefined") return false;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "dark") return true;
    if (saved === "light") return false;
    // 跟隨系統偏好
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    return false;
  }
};

export const useDarkMode = () => {
  const [isDark, setIsDark] = useState(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    try {
      localStorage.setItem(STORAGE_KEY, isDark ? "dark" : "light");
    } catch {}
  }, [isDark]);

  const toggle = useCallback(() => setIsDark((prev) => !prev), []);

  return { isDark, toggle };
};
