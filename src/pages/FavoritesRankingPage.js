// ============================================
// 檔案名稱: FavoritesRankingPage.js
// 路徑: src/pages/FavoritesRankingPage.js
// 用途: 收藏榜子頁 - 薄 wrapper,實際版型由 SubRankingPage 提供
// ============================================

import React from "react";
import SubRankingPage from "../components/SubRankingPage";

export default function FavoritesRankingPage() {
  return <SubRankingPage type="favorites" />;
}
