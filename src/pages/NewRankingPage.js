// ============================================
// 檔案名稱: NewRankingPage.js
// 路徑: src/pages/NewRankingPage.js
// 用途: 新書榜子頁 - 薄 wrapper,實際版型由 SubRankingPage 提供
// ============================================

import React from "react";
import SubRankingPage from "../components/SubRankingPage";

export default function NewRankingPage() {
  return <SubRankingPage type="new" />;
}
