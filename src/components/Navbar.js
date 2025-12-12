import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { logout } from "../firebase/auth";

const Navbar = ({ showBackButton = false }) => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // ========== 處理登出 ==========
  const handleLogout = async () => {
    try {
      await logout();
      setShowUserMenu(false);
      navigate("/");
    } catch (error) {
      console.error("登出失敗:", error);
      alert("登出失敗,請重試");
    }
  };

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
            {/* 個人中心 */}
            <Link
              to="/profile"
              className="text-white hover:text-pink transition-colors"
            >
              個人中心
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

            {/* 使用者選單 */}
            {loading ? (
              // 載入中
              <div className="w-8 h-8 rounded-full bg-white/20 animate-pulse"></div>
            ) : user ? (
              // 已登入 - 顯示使用者選單
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 text-white hover:text-pink transition-colors"
                >
                  {/* 使用者頭像 */}
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                    <span className="text-primary font-semibold">
                      {user.displayName
                        ? user.displayName.charAt(0).toUpperCase()
                        : user.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  {/* 使用者名稱 (桌面版顯示) */}
                  <span className="hidden md:block">
                    {user.displayName || user.email.split("@")[0]}
                  </span>
                  {/* 下拉箭頭 */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* 下拉選單 */}
                {showUserMenu && (
                  <>
                    {/* 遮罩層 (點擊關閉選單) */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowUserMenu(false)}
                    ></div>

                    {/* 選單內容 */}
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-20">
                      {/* 使用者資訊 */}
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="text-sm font-semibold text-dark break-words">
                          {user.displayName || "使用者"}
                        </p>
                        <p className="text-xs text-gray-500 break-words">
                          {user.email}
                        </p>
                      </div>

                      {/* 選單項目 */}
                      <Link
                        to="/profile"
                        onClick={() => setShowUserMenu(false)}
                        className="block px-4 py-2 text-sm text-dark hover:bg-light transition-colors"
                      >
                        個人中心
                      </Link>
                      <Link
                        to="/my-uploads"
                        onClick={() => setShowUserMenu(false)}
                        className="block px-4 py-2 text-sm text-dark hover:bg-light transition-colors"
                      >
                        我的上傳
                      </Link>

                      {/* 分隔線 */}
                      <div className="border-t border-gray-200 my-1"></div>

                      {/* 登出按鈕 */}
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        登出
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              // 未登入 - 顯示登入按鈕
              <Link
                to="/auth"
                className="flex items-center space-x-2 px-4 py-2 bg-white text-primary rounded-lg 
                         hover:bg-white/90 transition-colors font-semibold"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                  />
                </svg>
                <span className="hidden md:block">登入</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
