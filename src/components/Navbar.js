import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { logout } from "../firebase/auth";
import { useUnreadNotifications } from "../hooks/useUnreadNotifications";
import {
  getNotifications,
  markAllNotificationsAsRead,
} from "../firebase/notifications";
import { ADMIN_UID } from "../config/adminConfig";

const Navbar = ({ showBackButton = false }) => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const unreadCount = useUnreadNotifications();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const searchInputRef = useRef(null);

  const formatNotifDate = (val) => {
    if (!val) return "";
    try {
      const date =
        typeof val.toDate === "function" ? val.toDate() : new Date(val);
      return `${date.getMonth() + 1}/${String(date.getDate()).padStart(2, "0")}`;
    } catch {
      return "";
    }
  };

  const handleOpenNotifications = async () => {
    if (showNotifications) {
      setShowNotifications(false);
      return;
    }
    setShowNotifications(true);
    setNotifLoading(true);
    const data = await getNotifications(user.uid);
    setNotifications(data);
    setNotifLoading(false);
    markAllNotificationsAsRead(user.uid).catch(() => {});
  };

  // 展開搜尋列時自動 focus
  useEffect(() => {
    if (showSearch) {
      searchInputRef.current?.focus();
    }
  }, [showSearch]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    setShowSearch(false);
    setSearchQuery("");
  };

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
            <Link to="/" className="flex items-center gap-2">
              <img
                src="/navbar-logo.png"
                alt="PR小說網"
                className="w-12 h-12 rounded-lg object-contain"
              />
              <span className="text-2xl font-bold text-white">PR小說網</span>
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
            {/* 漢堡選單按鈕 (手機版) */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden text-white hover:text-pink transition-colors"
              aria-label="選單"
            >
              {showMobileMenu ? (
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
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
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
            {/* 搜尋區 */}
            {showSearch ? (
              <form
                onSubmit={handleSearchSubmit}
                className="flex items-center gap-2"
              >
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜尋標題、作者、標籤..."
                  className="w-48 md:w-64 px-3 py-1.5 rounded-lg text-dark text-sm
                           focus:outline-none focus:ring-2 focus:ring-white/50"
                  onKeyDown={(e) => e.key === "Escape" && setShowSearch(false)}
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowSearch(false);
                    setSearchQuery("");
                  }}
                  className="text-white hover:text-white/70 transition-colors"
                >
                  ✕
                </button>
              </form>
            ) : (
              <button
                onClick={() => setShowSearch(true)}
                className="text-white hover:text-pink transition-colors"
                aria-label="搜尋"
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
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            )}

            {/* 通知鈴鐺（已登入才顯示） */}
            {user && (
              <div className="relative">
                <button
                  onClick={handleOpenNotifications}
                  className="relative text-white hover:text-pink transition-colors"
                  aria-label="通知"
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
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  {unreadCount > 0 && (
                    <span
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full
                                     flex items-center justify-center text-white text-[10px] font-bold"
                    >
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {/* 通知下拉選單 */}
                {showNotifications && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowNotifications(false)}
                    />
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-20 overflow-hidden">
                      {/* 標題列 */}
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <span className="font-semibold text-dark text-sm">
                          通知
                        </span>
                        <Link
                          to="/notifications"
                          onClick={() => setShowNotifications(false)}
                          className="text-xs text-primary hover:text-primary/80 transition-colors"
                        >
                          查看全部
                        </Link>
                      </div>

                      {/* 通知列表 */}
                      <div className="max-h-96 overflow-y-auto">
                        {notifLoading ? (
                          <p className="text-center text-gray-400 text-sm py-6">
                            載入中...
                          </p>
                        ) : notifications.length === 0 ? (
                          <p className="text-center text-gray-400 text-sm py-6">
                            目前沒有通知
                          </p>
                        ) : (
                          notifications.slice(0, 10).map((n) => (
                            <div
                              key={n.id}
                              onClick={() => {
                                const hash = n.commentId ? `#comment-${n.commentId}` : "";
                                navigate(`/novel/${n.novelId}${hash}`);
                                setShowNotifications(false);
                              }}
                              className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-light transition-colors border-b border-gray-50 ${
                                !n.read ? "bg-primary/5" : ""
                              }`}
                            >
                              {/* 類型圖示 */}
                              <div
                                className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs mt-0.5 ${
                                  n.type === "reply" ? "bg-blue-100 text-blue-600"
                                  : n.type === "report" ? "bg-orange-100 text-orange-500"
                                  : n.type === "comment_deleted" ? "bg-red-100 text-red-500"
                                  : n.type === "report_resolved" ? "bg-green-100 text-green-600"
                                  : "bg-pink-100 text-pink-500"
                                }`}
                              >
                                {n.type === "reply" ? "↩"
                                : n.type === "report" ? "⚑"
                                : n.type === "comment_deleted" ? "✕"
                                : n.type === "report_resolved" ? "✓"
                                : "♥"}
                              </div>

                              {/* 內容 */}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-700 leading-relaxed">
                                  <span className="font-semibold text-dark">
                                    {n.fromUserName}
                                  </span>
                                  {n.type === "reply"
                                    ? " 回覆了你的留言"
                                    : n.type === "report"
                                    ? ` 檢舉了一則留言 — 原因：${n.reason || ""}`
                                    : n.type === "comment_deleted"
                                    ? "你的留言已被管理員刪除"
                                    : n.type === "report_resolved"
                                    ? "你檢舉的留言已被管理員處理"
                                    : " 對你的留言按讚"}
                                </p>
                                {n.novelTitle && (
                                  <p className="text-xs text-primary truncate">
                                    《{n.novelTitle}》
                                  </p>
                                )}
                                {n.commentContent && (
                                  <p className="text-xs text-gray-400 truncate">
                                    「{n.commentContent}」
                                  </p>
                                )}
                              </div>

                              {/* 日期 + 未讀點 */}
                              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                <span className="text-xs text-gray-400">
                                  {formatNotifDate(n.createdAt)}
                                </span>
                                {!n.read && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

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

                      {/* 管理員後台 */}
                      {user.uid === ADMIN_UID && (
                        <Link
                          to="/admin"
                          onClick={() => setShowUserMenu(false)}
                          className="block px-4 py-2 text-sm text-primary font-medium hover:bg-light transition-colors"
                        >
                          管理員後台
                        </Link>
                      )}

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

      {/* 手機版下拉選單 */}
      {showMobileMenu && (
        <div className="md:hidden bg-primary/95 border-t border-white/20">
          <div className="container mx-auto px-4 py-2 flex flex-col">
            <Link
              to="/"
              onClick={() => setShowMobileMenu(false)}
              className="py-3 text-white border-b border-white/10 hover:text-pink transition-colors"
            >
              首頁
            </Link>
            <Link
              to="/tags"
              onClick={() => setShowMobileMenu(false)}
              className="py-3 text-white border-b border-white/10 hover:text-pink transition-colors"
            >
              標籤
            </Link>
            <Link
              to="/ranking"
              onClick={() => setShowMobileMenu(false)}
              className="py-3 text-white border-b border-white/10 hover:text-pink transition-colors"
            >
              排行榜
            </Link>
            <Link
              to="/upload"
              onClick={() => setShowMobileMenu(false)}
              className="py-3 text-white border-b border-white/10 hover:text-pink transition-colors"
            >
              上傳
            </Link>
            <Link
              to="/profile"
              onClick={() => setShowMobileMenu(false)}
              className="py-3 text-white hover:text-pink transition-colors"
            >
              個人中心
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
