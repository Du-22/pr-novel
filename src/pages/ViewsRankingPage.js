// ============================================
// 檔案名稱: ViewsRankingPage.js
// 路徑: src/pages/ViewsRankingPage.js
// 用途: 人氣榜子頁 - 薄 wrapper,實際版型由 SubRankingPage 提供
// ============================================

import React from "react";
import SubRankingPage from "../components/SubRankingPage";

export default function ViewsRankingPage() {
  return <SubRankingPage type="views" />;
}
