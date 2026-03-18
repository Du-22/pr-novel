import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { loadAllNovels } from "./utils/novelsHelper";
import ScrollToTop from "./components/ScrollToTop";
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
import ProfilePage from "./pages/ProfilePage";
import AuthPage from "./pages/AuthPage";
import SearchPage from "./pages/SearchPage";
import SyncIndicator from "./components/SyncIndicator";

function App() {
  const [novelsReady, setNovelsReady] = useState(false);

  useEffect(() => {
    loadAllNovels().then(() => setNovelsReady(true));
  }, []);

  if (!novelsReady) {
    return (
      <div className="min-h-screen bg-light flex items-center justify-center">
        <p className="text-gray-400">載入中...</p>
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

        {/* 閱讀頁 (待開發) */}
        <Route path="/novel/:id/read/:chapter" element={<ReadingPage />} />

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

        {/* 個人中心頁 */}
        <Route path="/profile" element={<ProfilePage />} />

        {/* 搜尋頁 */}
        <Route path="/search" element={<SearchPage />} />

        {/* 登入頁 */}
        <Route path="/auth" element={<AuthPage />} />

        {/* 404頁面 */}
        <Route path="*" element={<div>頁面不存在</div>} />
      </Routes>
      <SyncIndicator /> {/* 同步狀態指示器 */}
    </Router>
  );
}

export default App;
