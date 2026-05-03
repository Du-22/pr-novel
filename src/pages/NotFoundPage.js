// ============================================
// 檔案名稱: NotFoundPage.js
// 路徑: src/pages/NotFoundPage.js
// 用途: 404 頁面 — 找不到對應路由時顯示
// ============================================

import React from "react";
import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950">
      <Navbar showBackButton={true} />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-16 sm:py-24 text-center">
        {/* 大 404 (作為背景視覺) */}
        <p className="text-7xl sm:text-9xl font-bold mb-2 leading-none tracking-tighter
                      text-primary/15 dark:text-primary-light/15">
          404
        </p>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3
                       text-neutral-900 dark:text-neutral-100">
          找不到這個頁面
        </h1>
        <p className="mb-8 text-neutral-500 dark:text-neutral-400">
          你要找的頁面不存在或已被移除
        </p>

        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all
                     bg-primary text-white shadow-sm
                     hover:bg-primary-dark hover:-translate-y-0.5 hover:shadow-md"
        >
          <Compass className="w-5 h-5" />
          回到首頁
        </Link>
      </main>

      <Footer />
    </div>
  );
}
