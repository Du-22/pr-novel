import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { loadAllNovels } from "./utils/novelsHelper";
import ScrollToTop from "./components/ScrollToTop";
import Logo from "./components/Logo";
import HomePage from "./pages/HomePage";
import NovelDetailPage from "./pages/NovelDetailPage";
import ReadingPage from "./pages/ReadingPage";
import RankingPage from "./pages/RankingPage";
import FavoritesRankingPage from "./pages/FavoritesRankingPage";
import ViewsRankingPage from "./pages/ViewsRankingPage";
import NewRankingPage from "./pages/NewRankingPage";
import TagsPage from "./pages/TagsPage";
import UploadPage from "./pages/UploadPage";
import MyUploadsPage from "./pages/MyUploadsPage";
import EditUploadPage from "./pages/EditUploadPage";
import EditChapterPage from "./pages/EditChapterPage";
import ProfilePage from "./pages/ProfilePage";
import AuthPage from "./pages/AuthPage";
import NotificationsPage from "./pages/NotificationsPage";
import SearchPage from "./pages/SearchPage";
import UserProfilePage from "./pages/UserProfilePage";
import NotFoundPage from "./pages/NotFoundPage";
import AdminPage from "./pages/AdminPage";

function App() {
  const [novelsReady, setNovelsReady] = useState(false);

  useEffect(() => {
    loadAllNovels().then(() => setNovelsReady(true));
  }, []);

  if (!novelsReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4
                      bg-neutral-50 dark:bg-neutral-950">
        <Logo className="w-12 h-12 text-primary dark:text-primary-light" />
        <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          載入中...
        </div>
      </div>
    );
  }

  return (
    <Router>
      <ScrollToTop /> {/* 跳轉頁面時滾動到頂部 */}
      <Routes>
        {/* 首頁 */}
        <Route path="/" element={<HomePage />} />

        {/* 小說詳情頁 */}
        <Route path="/novel/:id" element={<NovelDetailPage />} />

        {/* 閱讀頁 — 單卷小說 */}
        <Route path="/novel/:id/read/:chapter" element={<ReadingPage />} />
        {/* 閱讀頁 — 分卷小說(URL 多帶卷號)*/}
        <Route path="/novel/:id/read/:vol/:ch" element={<ReadingPage />} />

        {/* 排行榜頁 */}
        <Route path="/ranking" element={<RankingPage />} />

        {/* 新書榜 */}
        <Route path="/ranking/new" element={<NewRankingPage />} />

        {/* 收藏榜 */}
        <Route path="/ranking/favorites" element={<FavoritesRankingPage />} />

        {/* 人氣榜 */}
        <Route path="/ranking/views" element={<ViewsRankingPage />} />

        {/* 標籤篩選頁 */}
        <Route path="/tags" element={<TagsPage />} />

        {/* 上傳頁 */}
        <Route path="/upload" element={<UploadPage />} />

        {/* 我的上傳管理頁 */}
        <Route path="/my-uploads" element={<MyUploadsPage />} />
        <Route path="/my-uploads/edit/:id" element={<EditUploadPage />} />
        {/* 編輯章節 — 單卷 */}
        <Route path="/my-uploads/edit/:id/chapter/:chapterNumber" element={<EditChapterPage />} />
        {/* 編輯章節 — 分卷 */}
        <Route path="/my-uploads/edit/:id/v/:vol/chapter/:ch" element={<EditChapterPage />} />

        {/* 個人中心頁 */}
        <Route path="/profile" element={<ProfilePage />} />

        {/* 搜尋頁 */}
        <Route path="/search" element={<SearchPage />} />

        {/* 通知頁 */}
        <Route path="/notifications" element={<NotificationsPage />} />

        {/* 公開使用者頁面 */}
        <Route path="/user/:uid" element={<UserProfilePage />} />

        {/* 登入頁 */}
        <Route path="/auth" element={<AuthPage />} />

        {/* 管理員後台 */}
        <Route path="/admin" element={<AdminPage />} />

        {/* 404頁面 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default App;
