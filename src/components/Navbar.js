// ============================================
// 檔案名稱: Navbar.js
// 路徑: src/components/Navbar.js
// 用途: 全站導覽列 - 半透明白底 + backdrop-blur,
//       含 logo、導覽連結、搜尋、通知、使用者選單
// ============================================

import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Bell,
  Menu,
  X,
  ChevronDown,
  LogIn,
  ArrowLeft,
  Reply,
  Heart,
  Flag,
  Check,
  Sun,
  Moon,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useDarkMode } from "../hooks/useDarkMode";
import { logout } from "../firebase/auth";
import { useUnreadNotifications } from "../hooks/useUnreadNotifications";
import {
  getNotifications,
  markAllNotificationsAsRead,
} from "../firebase/notifications";
import { ADMIN_UID } from "../config/adminConfig";
import Logo from "./Logo";

const Navbar = ({ showBackButton = false, backTo = null }) => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { isDark, toggle: toggleDarkMode } = useDarkMode();
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

  // 通知類型 → lucide icon + 顏色 token mapping
  const getNotifIconConfig = (type) => {
    switch (type) {
      case "reply":
        return { Icon: Reply, bg: "bg-info-light", text: "text-info" };
      case "report":
        return { Icon: Flag, bg: "bg-warning-light", text: "text-warning" };
      case "comment_deleted":
        return { Icon: X, bg: "bg-danger-light", text: "text-danger" };
      case "report_resolved":
        return { Icon: Check, bg: "bg-success-light", text: "text-success" };
      default:
        return { Icon: Heart, bg: "bg-warm-50", text: "text-warm" };
    }
  };

  return (
    <nav
      className="sticky top-0 z-50 bg-white/[0.78] backdrop-blur-xl backdrop-saturate-150
                 border-b border-neutral-200
                 dark:bg-neutral-900/[0.78] dark:border-neutral-800"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* 左側: 返回按鈕 + Logo */}
          <div className="flex items-center space-x-2">
            {showBackButton && (
              <button
                onClick={() => (backTo ? navigate(backTo) : navigate(-1))}
                className="p-2 text-neutral-700 hover:text-primary transition-colors
                           dark:text-neutral-300 dark:hover:text-primary-light"
                aria-label={backTo ? "返回小說詳情" : "返回上一頁"}
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}

            <Link to="/" className="flex items-center gap-2">
              <Logo className="w-8 h-8 text-primary dark:text-primary-light" />
              <span className="text-xl font-bold text-neutral-900 tracking-tight dark:text-neutral-100">
                PR小說網
              </span>
            </Link>
          </div>

          {/* 中間導覽連結 */}
          <div className="hidden md:flex items-center space-x-8 text-[15px] font-medium">
            <Link
              to="/"
              className="text-neutral-700 hover:text-primary transition-colors
                         dark:text-neutral-300 dark:hover:text-primary-light"
            >
              首頁
            </Link>
            <Link
              to="/tags"
              className="text-neutral-700 hover:text-primary transition-colors
                         dark:text-neutral-300 dark:hover:text-primary-light"
            >
              標籤
            </Link>
            <Link
              to="/ranking"
              className="text-neutral-700 hover:text-primary transition-colors
                         dark:text-neutral-300 dark:hover:text-primary-light"
            >
              排行榜
            </Link>
            <Link
              to="/upload"
              onClick={(e) => {
                if (!user) {
                  e.preventDefault();
                  navigate("/auth");
                }
              }}
              className="text-neutral-700 hover:text-primary transition-colors
                         dark:text-neutral-300 dark:hover:text-primary-light"
            >
              上傳
            </Link>
            <Link
              to="/profile"
              className="text-neutral-700 hover:text-primary transition-colors
                         dark:text-neutral-300 dark:hover:text-primary-light"
            >
              個人中心
            </Link>
          </div>

          {/* 右側按鈕 */}
          <div className="flex items-center space-x-2">
            {/* 漢堡選單按鈕 (手機版) */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 text-neutral-700 hover:text-primary hover:bg-neutral-100 rounded-lg transition-colors
                         dark:text-neutral-300 dark:hover:text-primary-light dark:hover:bg-neutral-800"
              aria-label="選單"
            >
              {showMobileMenu ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
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
                  className="w-48 md:w-64 px-3 py-1.5 rounded-lg text-sm
                             bg-neutral-100 text-neutral-900 placeholder-neutral-400
                             border border-neutral-200
                             focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
                             dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500
                             dark:border-neutral-700"
                  onKeyDown={(e) => e.key === "Escape" && setShowSearch(false)}
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowSearch(false);
                    setSearchQuery("");
                  }}
                  className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors
                             dark:text-neutral-400 dark:hover:text-neutral-100 dark:hover:bg-neutral-800"
                  aria-label="關閉搜尋"
                >
                  <X className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <button
                onClick={() => setShowSearch(true)}
                className="p-2 text-neutral-700 hover:text-primary hover:bg-neutral-100 rounded-lg transition-colors
                           dark:text-neutral-300 dark:hover:text-primary-light dark:hover:bg-neutral-800"
                aria-label="搜尋"
              >
                <Search className="h-5 w-5" />
              </button>
            )}

            {/* Dark mode 切換 */}
            <button
              onClick={toggleDarkMode}
              className="p-2 text-neutral-700 hover:text-primary hover:bg-neutral-100 rounded-lg transition-colors
                         dark:text-neutral-300 dark:hover:text-primary-light dark:hover:bg-neutral-800"
              aria-label={isDark ? "切換到日間模式" : "切換到夜間模式"}
              title={isDark ? "切換到日間模式" : "切換到夜間模式"}
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* 通知鈴鐺 (已登入才顯示) */}
            {user && (
              <div className="relative">
                <button
                  onClick={handleOpenNotifications}
                  className="relative p-2 text-neutral-700 hover:text-primary hover:bg-neutral-100 rounded-lg transition-colors
                             dark:text-neutral-300 dark:hover:text-primary-light dark:hover:bg-neutral-800"
                  aria-label="通知"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span
                      className="absolute top-1 right-1 min-w-[16px] h-4 px-1
                                 bg-danger text-white rounded-full
                                 flex items-center justify-center text-[10px] font-bold"
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
                    <div
                      className="absolute right-0 mt-2 w-80 z-20 overflow-hidden
                                    bg-white rounded-xl shadow-xl border border-neutral-200
                                    dark:bg-neutral-900 dark:border-neutral-800"
                    >
                      {/* 標題列 */}
                      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
                        <span className="font-semibold text-neutral-900 text-sm dark:text-neutral-100">
                          通知
                        </span>
                        <Link
                          to="/notifications"
                          onClick={() => setShowNotifications(false)}
                          className="text-xs font-medium text-primary hover:text-primary-dark transition-colors
                                     dark:text-primary-light dark:hover:text-primary"
                        >
                          查看全部
                        </Link>
                      </div>

                      {/* 通知列表 */}
                      <div className="max-h-96 overflow-y-auto">
                        {notifLoading ? (
                          <p className="text-center text-neutral-400 text-sm py-6">
                            載入中...
                          </p>
                        ) : notifications.length === 0 ? (
                          <p className="text-center text-neutral-400 text-sm py-6">
                            目前沒有通知
                          </p>
                        ) : (
                          notifications.slice(0, 10).map((n) => {
                            const { Icon, bg, text } = getNotifIconConfig(n.type);
                            return (
                              <div
                                key={n.id}
                                onClick={() => {
                                  const hash = n.commentId
                                    ? `#comment-${n.commentId}`
                                    : "";
                                  navigate(`/novel/${n.novelId}${hash}`);
                                  setShowNotifications(false);
                                }}
                                className={`flex items-start gap-3 px-4 py-3 cursor-pointer
                                            border-b border-neutral-50 last:border-b-0
                                            hover:bg-neutral-50 transition-colors
                                            dark:border-neutral-800 dark:hover:bg-neutral-800
                                            ${!n.read ? "bg-primary-50 dark:bg-primary/10" : ""}`}
                              >
                                {/* 類型圖示 */}
                                <div
                                  className={`flex-shrink-0 w-7 h-7 rounded-full
                                              flex items-center justify-center mt-0.5
                                              ${bg} ${text}`}
                                >
                                  <Icon className="w-3.5 h-3.5" />
                                </div>

                                {/* 內容 */}
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs leading-relaxed text-neutral-700 dark:text-neutral-300">
                                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">
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
                                    <p className="text-xs truncate text-primary dark:text-primary-light">
                                      《{n.novelTitle}》
                                    </p>
                                  )}
                                  {n.commentContent && (
                                    <p className="text-xs truncate text-neutral-400">
                                      「{n.commentContent}」
                                    </p>
                                  )}
                                </div>

                                {/* 日期 + 未讀點 */}
                                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                  <span className="text-[11px] text-neutral-400">
                                    {formatNotifDate(n.createdAt)}
                                  </span>
                                  {!n.read && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                  )}
                                </div>
                              </div>
                            );
                          })
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
              <div className="w-8 h-8 rounded-full bg-neutral-200 animate-pulse dark:bg-neutral-700"></div>
            ) : user ? (
              // 已登入 - 顯示使用者選單
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-1.5 rounded-lg
                             text-neutral-700 hover:bg-neutral-100 transition-colors
                             dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  {/* 使用者頭像 */}
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center
                                  dark:bg-primary/20">
                    <span className="text-primary font-semibold text-sm dark:text-primary-light">
                      {user.displayName
                        ? user.displayName.charAt(0).toUpperCase()
                        : user.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  {/* 使用者名稱 (桌面版顯示) */}
                  <span className="hidden md:block text-sm font-medium">
                    {user.displayName || user.email.split("@")[0]}
                  </span>
                  <ChevronDown className="h-4 w-4 text-neutral-500" />
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
                    <div
                      className="absolute right-0 mt-2 w-48 py-2 z-20
                                    bg-white rounded-xl shadow-xl border border-neutral-200
                                    dark:bg-neutral-900 dark:border-neutral-800"
                    >
                      {/* 使用者資訊 */}
                      <div className="px-4 py-2 border-b border-neutral-100 dark:border-neutral-800">
                        <p className="text-sm font-semibold text-neutral-900 break-words dark:text-neutral-100">
                          {user.displayName || "使用者"}
                        </p>
                        <p className="text-xs text-neutral-500 break-words dark:text-neutral-400">
                          {user.email}
                        </p>
                      </div>

                      {/* 選單項目 */}
                      <Link
                        to="/profile"
                        onClick={() => setShowUserMenu(false)}
                        className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 transition-colors
                                   dark:text-neutral-300 dark:hover:bg-neutral-800"
                      >
                        個人中心
                      </Link>
                      <Link
                        to="/my-uploads"
                        onClick={() => setShowUserMenu(false)}
                        className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 transition-colors
                                   dark:text-neutral-300 dark:hover:bg-neutral-800"
                      >
                        我的上傳
                      </Link>

                      {/* 管理員後台 */}
                      {user.uid === ADMIN_UID && (
                        <Link
                          to="/admin"
                          onClick={() => setShowUserMenu(false)}
                          className="block px-4 py-2 text-sm font-medium text-primary hover:bg-neutral-100 transition-colors
                                     dark:text-primary-light dark:hover:bg-neutral-800"
                        >
                          管理員後台
                        </Link>
                      )}

                      {/* 分隔線 */}
                      <div className="border-t border-neutral-100 my-1 dark:border-neutral-800"></div>

                      {/* 登出按鈕 */}
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-danger
                                   hover:bg-danger-light transition-colors
                                   dark:hover:bg-danger/10"
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
                className="flex items-center space-x-2 px-4 py-2 rounded-lg
                           bg-primary text-white font-semibold text-sm
                           hover:bg-primary-dark transition-colors"
              >
                <LogIn className="h-4 w-4" />
                <span className="hidden md:block">登入</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 手機版下拉選單 */}
      {showMobileMenu && (
        <div className="md:hidden border-t bg-white border-neutral-200
                        dark:bg-neutral-900 dark:border-neutral-800">
          <div className="container mx-auto px-4 py-2 flex flex-col">
            <Link
              to="/"
              onClick={() => setShowMobileMenu(false)}
              className="py-3 text-neutral-700 border-b border-neutral-100 hover:text-primary transition-colors
                         dark:text-neutral-300 dark:border-neutral-800 dark:hover:text-primary-light"
            >
              首頁
            </Link>
            <Link
              to="/tags"
              onClick={() => setShowMobileMenu(false)}
              className="py-3 text-neutral-700 border-b border-neutral-100 hover:text-primary transition-colors
                         dark:text-neutral-300 dark:border-neutral-800 dark:hover:text-primary-light"
            >
              標籤
            </Link>
            <Link
              to="/ranking"
              onClick={() => setShowMobileMenu(false)}
              className="py-3 text-neutral-700 border-b border-neutral-100 hover:text-primary transition-colors
                         dark:text-neutral-300 dark:border-neutral-800 dark:hover:text-primary-light"
            >
              排行榜
            </Link>
            <Link
              to="/upload"
              onClick={(e) => {
                setShowMobileMenu(false);
                if (!user) {
                  e.preventDefault();
                  navigate("/auth");
                }
              }}
              className="py-3 text-neutral-700 border-b border-neutral-100 hover:text-primary transition-colors
                         dark:text-neutral-300 dark:border-neutral-800 dark:hover:text-primary-light"
            >
              上傳
            </Link>
            <Link
              to="/profile"
              onClick={() => setShowMobileMenu(false)}
              className="py-3 text-neutral-700 hover:text-primary transition-colors
                         dark:text-neutral-300 dark:hover:text-primary-light"
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
