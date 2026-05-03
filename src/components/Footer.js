// ============================================
// 檔案名稱: Footer.js
// 路徑: src/components/Footer.js
// 用途: 全站頁尾 — Logo + tagline + copyright,可重用於各頁面
// ============================================

import React from "react";
import Logo from "./Logo";

const Footer = () => {
  return (
    <footer
      className="mt-16 py-10 border-t bg-white border-neutral-200
                 dark:bg-neutral-950 dark:border-neutral-800"
    >
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <Logo className="w-7 h-7 text-primary dark:text-primary-light" />
            <span className="font-bold text-neutral-900 dark:text-neutral-100">
              PR 小說網
            </span>
          </div>

          {/* Tagline */}
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            一個讓創作者與讀者真正相遇的小說平台
          </p>

          {/* Copyright */}
          <p className="text-xs text-neutral-400 dark:text-neutral-500">
            © {new Date().getFullYear()} PR 小說網
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
