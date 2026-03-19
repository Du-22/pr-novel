// ============================================
// 檔案名稱: NotFoundPage.js
// 路徑: src/pages/NotFoundPage.js
// 用途: 404 頁面不存在
// ============================================
import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-light">
      <Navbar showBackButton={true} />
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <p className="text-8xl font-bold text-primary/20 mb-4">404</p>
        <h1 className="text-2xl font-bold text-dark mb-3">找不到這個頁面</h1>
        <p className="text-gray-500 mb-8">你要找的頁面不存在或已被移除</p>
        <Link
          to="/"
          className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold"
        >
          回到首頁
        </Link>
      </div>
    </div>
  );
}
