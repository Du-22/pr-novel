import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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

function App() {
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

        {/* 其他頁面 (待開發) */}
        {/* <Route path="/upload" element={<UploadPage />} /> */}
        {/* <Route path="/profile" element={<ProfilePage />} /> */}
        {/* <Route path="/auth" element={<AuthPage />} /> */}
      </Routes>
    </Router>
  );
}

export default App;
