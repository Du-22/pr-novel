import React from "react";
import { Link, useNavigate } from "react-router-dom";

const Navbar = ({ showBackButton = false }) => {
  const navigate = useNavigate();

  return (
    <nav className="bg-gradient-to-r from-primary to-secondary shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* 左側: 返回按鈕 + Logo */}
          <div className="flex items-center space-x-2">
            {/* 返回按鈕 (可選) */}
            {showBackButton && (
              <button
                onClick={() => navigate(-1)}
                className="text-white hover:text-pink transition-colors p-2"
                aria-label="返回上一頁"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
            )}

            {/* Logo */}
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-bold text-white">📚 PR小說網</span>
            </Link>
          </div>

          {/* 中間導覽連結 */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className="text-white hover:text-pink transition-colors"
            >
              首頁
            </Link>
            <Link
              to="/tags"
              className="text-white hover:text-pink transition-colors"
            >
              標籤
            </Link>
            <Link
              to="/ranking"
              className="text-white hover:text-pink transition-colors"
            >
              排行榜
            </Link>
            <Link
              to="/upload"
              className="text-white hover:text-pink transition-colors"
            >
              上傳
            </Link>
          </div>

          {/* 右側按鈕 */}
          <div className="flex items-center space-x-4">
            {/* 搜尋按鈕 */}
            <button className="text-white hover:text-pink transition-colors">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>

            {/* 登入按鈕 */}
            <Link
              to="/auth"
              className="text-white hover:text-pink transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
