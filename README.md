# 📚 PR 小說網

> 一個基於 React 開發的現代化小說閱讀平台

[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-38B2AC.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## 🎯 專案簡介

PR 小說網是一個全端小說閱讀平台，提供流暢的閱讀體驗、智慧書籤系統、以及完整的小說管理功能。這是我的第一個完整全端專案，展現了從需求分析、UI/UX 設計到功能實作的完整開發流程。

**線上展示：** [即將上線]

## ✨ 核心功能

### 📖 閱讀體驗

- **智慧書籤系統** - 自動記錄閱讀位置，支援跨章節續讀
- **已讀標記** - 自動追蹤閱讀進度，清楚顯示已讀章節
- **自動分頁** - 超過 3000 字自動分頁，提升閱讀舒適度
- **護眼閱讀模式** - 精心設計的配色和排版（行距 1.8、字體 1.1rem）

### 🎨 內容探索

- **本期強推** - 每週隨機推薦 6 本精選小說
- **標籤篩選** - 支援多選標籤 + AND 邏輯精準篩選
- **排行榜系統** - 人氣榜、收藏榜、新書榜三大榜單
- **智慧推薦** - 根據標籤相似度推薦相關作品

### 📝 創作管理

- **一鍵上傳** - 支援 TXT 檔案自動解析章節
- **智慧解析** - 支援多種章節格式（中文數字、阿拉伯數字）
- **封面壓縮** - 自動壓縮至 40-50KB，節省儲存空間
- **即時預覽** - 上傳後即時預覽章節列表和字數統計

### 📊 數據統計

- **閱讀追蹤** - 即時統計每本小說的閱讀數
- **收藏系統** - 一鍵收藏喜愛的作品
- **完整數據** - 展示收藏數、閱讀數、章節數、總字數

## 🛠️ 技術棧

### 前端框架

- **React 18** - 使用 Hooks 進行狀態管理
- **React Router 6** - 單頁應用路由管理
- **Tailwind CSS** - 快速構建響應式 UI

### 資料儲存

- **localStorage** - MVP 階段使用本地儲存
- **Firebase** (規劃中) - 未來升級至雲端資料庫

### 工具與函式庫

- **自製章節解析器** - 支援多種中文數字格式
- **圖片壓縮工具** - Canvas API 實作封面壓縮
- **書籤管理系統** - 完整的閱讀進度追蹤

## 📂 專案結構

```
pr-novel-web/
├── public/
│   ├── data/novels/          # 15本測試小說 TXT 檔案
│   └── images/covers/        # 封面圖片資源
├── src/
│   ├── components/           # 可複用元件
│   │   ├── Navbar.js
│   │   ├── NovelCard.js
│   │   ├── RankingCard.js
│   │   └── upload/           # 上傳相關元件
│   ├── pages/                # 頁面元件
│   │   ├── HomePage.js
│   │   ├── NovelDetailPage.js
│   │   ├── ReadingPage.js
│   │   ├── RankingPage.js
│   │   ├── TagsPage.js
│   │   └── UploadPage.js
│   ├── utils/                # 工具函式
│   │   ├── parser.js         # 章節解析器
│   │   ├── bookmarkManager.js
│   │   ├── statsManager.js
│   │   ├── imageCompressor.js
│   │   └── novelsHelper.js
│   ├── data/
│   │   └── mockData.js       # 測試資料
│   └── App.js                # 路由配置
├── .gitignore
├── package.json
└── README.md
```

## 🚀 快速開始

### 環境需求

- Node.js 16.x 或以上
- npm 或 yarn

### 安裝步驟

```bash
# 1. Clone 專案
git clone https://github.com/Du-22/pr-novel.git
cd pr-novel

# 2. 安裝依賴
npm install

# 3. 啟動開發伺服器
npm start

# 4. 在瀏覽器開啟
# http://localhost:3000
```

### 建置生產版本

```bash
npm run build
```

## 🎨 設計規範

### 配色方案

```css
主色 (Primary):   #6C5CE7  /* 優雅紫 */
次色 (Secondary): #A29BFE  /* 淡紫 */
強調色 (Pink):     #FD79A8  /* 粉紅 */
深色 (Dark):      #2D3436  /* 深灰 */
淺色 (Light):     #F8F9FA  /* 淺灰白 */
護眼色:           #FEFDFB  /* 閱讀頁背景 */
```

### UI/UX 原則

- 無過多 emoji（除了 Logo）
- 閱讀頁最大寬度 800px
- 行距 1.8、字體 1.1rem
- 圓角膠囊樣式標籤
- 前三名排行榜特殊樣式（金/銀/銅）

## 📊 開發歷程

### 已完成功能 ✅

- [x] 首頁與小說卡片展示
- [x] 小說詳情頁與章節目錄
- [x] 閱讀頁與自動分頁
- [x] 書籤系統與已讀記錄
- [x] 排行榜系統（三大榜單）
- [x] 標籤篩選頁（多選 + AND 邏輯）
- [x] 上傳頁（TXT 解析 + 封面壓縮）
- [x] 統計數據追蹤

### 開發中功能 🚧

- [ ] 我的上傳管理頁
- [ ] 個人頁（收藏/作品/閱讀記錄）
- [ ] 登入/註冊系統
- [ ] Firebase 雲端同步

### 未來規劃 💡

- [ ] 評論系統
- [ ] 搜尋功能
- [ ] 閱讀設定面板（字體/配色）
- [ ] 跨裝置同步

## 🔧 核心技術亮點

### 1. 智慧章節解析器

支援多種章節格式，包含任意中文數字：

- `第一章` ✅
- `第二十一章` ✅
- `第九十九章` ✅
- `序章`、`後記` ✅

### 2. 圖片壓縮演算法

使用 Canvas API 實作：

- 自動調整至 400px 寬度
- 品質控制在 0.7
- 壓縮後約 40-50KB

### 3. 資料合併系統

優雅整合兩種資料來源：

- mockData（預設小說）
- localStorage（使用者上傳）

### 4. 書籤系統

- 自動儲存（每 30 秒）
- 離開頁面時儲存
- 支援章節 + 頁碼定位

## 📝 開發心得

這是我第一個完整的全端專案，從零開始學習 React 和前端開發。在開發過程中：

1. **學會了 React Hooks** - 深入理解 useState、useEffect 的使用時機
2. **掌握了路由管理** - React Router 的配置與導航
3. **實作了複雜邏輯** - 章節解析、書籤系統、標籤篩選
4. **重視使用者體驗** - 護眼配色、自動分頁、智慧書籤
5. **建立了工程思維** - 元件化設計、工具函式抽離、文件撰寫

未來計劃將 localStorage 升級為 Firebase，打造真正的線上平台。

## 📄 授權

本專案採用 [MIT License](LICENSE) 授權

## 👨‍💻 作者

**Du-22**

- GitHub: [@Du-22](https://github.com/Du-22)
- 專案連結: [https://github.com/Du-22/pr-novel](https://github.com/Du-22/pr-novel)

## 🙏 致謝

感謝 Claude AI 在開發過程中提供的技術協助與建議。

---

⭐ 如果這個專案對你有幫助，歡迎給個 Star！

```

```
