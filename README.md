# 📚 PR 小說網

> 一個基於 React + Firebase 開發的全端小說閱讀平台

[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-38B2AC.svg)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore%20%2B%20Auth-orange.svg)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## 🎯 專案簡介

PR 小說網是一個全端小說閱讀平台，提供流暢的閱讀體驗、智慧書籤系統、雲端資料同步，以及完整的小說管理與社群功能。這是我的第一個完整全端專案，展現了從需求分析、UI/UX 設計到 Firebase 整合的完整開發流程。

**線上展示：** [即將上線]

## ✨ 核心功能

### 📖 閱讀體驗

- **智慧書籤系統** - 自動記錄閱讀位置，支援跨章節續讀，並同步至雲端
- **已讀標記** - 自動追蹤閱讀進度，清楚顯示已讀章節
- **自動分頁** - 超過 3000 字自動分頁，提升閱讀舒適度
- **護眼閱讀模式** - 精心設計的配色和排版（行距 1.8、字體 1.1rem）

### 🔍 內容探索

- **搜尋功能** - 依作品名、作者名、標籤搜尋，支援類別切換
- **本期強推** - 每週隨機推薦精選小說
- **標籤篩選** - 支援多選標籤 + AND 邏輯精準篩選
- **排行榜系統** - 人氣榜、收藏榜、新書榜三大榜單
- **智慧推薦** - 根據標籤相似度推薦相關作品

### 👤 帳號與個人中心

- **Firebase Authentication** - Email/Password 註冊登入、Google 一鍵登入、忘記密碼
- **我的收藏** - 收藏管理，跨裝置雲端同步
- **我的作品** - 整合上傳管理、編輯刪除功能
- **閱讀記錄** - 進度追蹤、智慧續讀、視覺化進度條

### 📝 創作管理

- **一鍵上傳** - 支援 TXT 檔案自動解析章節，上傳後同步至 Firestore
- **智慧解析** - 支援多種章節格式（中文數字、阿拉伯數字）
- **封面壓縮** - 自動壓縮至 40-50KB，節省儲存空間
- **跨裝置同步** - 登入後自動從雲端拉取作品，不怕換裝置

### 💬 社群互動

- **讀者留言** - 在小說詳情頁留言，需登入，可刪除自己的留言

### ☁️ 雲端同步架構

- **離線優先** - 所有操作立即反映在 localStorage，背景同步至 Firestore
- **登入自動同步** - 登入後自動合併雲端與本地的收藏、書籤、閱讀記錄、小說列表
- **同步狀態提示** - 右下角即時顯示同步進度

## 🛠️ 技術棧

### 前端框架

- **React 18** - 使用 Hooks 進行狀態管理（useState、useEffect、useRef、useMemo）
- **React Router 6** - 單頁應用路由管理，含動態路由與 URL Query 參數
- **Tailwind CSS** - 快速構建響應式 UI（紫色系配色）

### 後端與資料

- **Firebase Authentication** - Email/Password + Google OAuth 登入
- **Firebase Firestore** - 雲端資料庫（收藏、書籤、閱讀記錄、小說、留言）
- **localStorage** - 離線快取，確保無網路時仍可使用

### 工具與函式庫

- **自製章節解析器** - 支援多種中文數字格式
- **Canvas API** - 封面圖片壓縮
- **離線優先同步架構** - localStorage ↔ Firestore 雙向合併

## 📂 專案結構

```
src/
├── components/
│   ├── Navbar.js              # 導覽列（含搜尋、登入狀態）
│   ├── NovelCard.js           # 小說卡片
│   ├── CommentsSection.js     # 留言元件
│   ├── SyncIndicator.js       # 雲端同步狀態提示
│   ├── profile/               # 個人頁 tab 元件
│   └── upload/                # 上傳相關元件
├── pages/
│   ├── HomePage.js
│   ├── NovelDetailPage.js
│   ├── ReadingPage.js
│   ├── SearchPage.js          # 搜尋頁（含類別篩選）
│   ├── RankingPage.js         # 排行榜（人氣/收藏/新書）
│   ├── TagsPage.js
│   ├── UploadPage.js
│   ├── MyUploadsPage.js
│   ├── EditUploadPage.js
│   ├── ProfilePage.js
│   └── AuthPage.js
├── hooks/
│   └── useAuth.js             # 登入狀態 Custom Hook（含登入後自動同步）
├── firebase/
│   ├── config.js              # Firebase 初始化
│   ├── auth.js                # 登入/註冊/登出
│   ├── firestore.js           # 通用 Firestore CRUD 工具
│   └── novels.js              # 小說相關 Firestore 操作
├── utils/
│   ├── parser.js              # 章節解析器
│   ├── bookmarkManager.js     # 書籤（localStorage + Firestore 同步）
│   ├── readHistoryManager.js  # 閱讀記錄（localStorage + Firestore 同步）
│   ├── favoritesManager.js    # 收藏（localStorage + Firestore 同步）
│   ├── uploadedNovelsManager.js # 上傳小說（localStorage + Firestore 同步）
│   ├── novelsHelper.js        # 資料合併（mockData + localStorage）
│   ├── statsManager.js        # 統計數據
│   └── imageCompressor.js     # 封面壓縮
└── data/
    └── mockData.js            # 15 本預設小說
```

## 🚀 快速開始

### 環境需求

- Node.js 16.x 或以上
- npm 或 yarn
- Firebase 專案（需自行建立）

### 安裝步驟

```bash
# 1. Clone 專案
git clone https://github.com/Du-22/pr-novel.git
cd pr-novel

# 2. 安裝依賴
npm install

# 3. 建立 .env 檔案（參考下方 Firebase 設定）
cp .env.example .env

# 4. 啟動開發伺服器
npm start
```

### Firebase 設定

在專案根目錄建立 `.env` 檔案：

```
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

Firestore Security Rules 請參考專案根目錄的 `firestore.rules`。

## 🎨 設計規範

### 配色方案

```css
主色 (Primary):   #6C5CE7  /* 優雅紫 */
次色 (Secondary): #A29BFE  /* 淡紫 */
深色 (Dark):      #2D3436  /* 深灰 */
淺色 (Light):     #F8F9FA  /* 淺灰白 */
護眼色:           #FEFDFB  /* 閱讀頁背景 */
```

### UI/UX 原則

- 無過多 emoji（除了 Logo）
- 閱讀頁最大寬度 800px，行距 1.8、字體 1.1rem
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
- [x] 我的上傳管理（列表/編輯/刪除）
- [x] 個人頁系統（收藏/作品/閱讀記錄）
- [x] Firebase Authentication（Email/Google 登入、忘記密碼）
- [x] Firestore 收藏雲端同步
- [x] Firestore 書籤雲端同步
- [x] Firestore 閱讀記錄雲端同步
- [x] Firestore 小說上傳與跨裝置同步
- [x] 搜尋功能（含類別篩選）
- [x] 讀者留言系統

### 未來規劃 💡

- [ ] 留言系統強化（巢狀回覆、按讚、樓層標記、站內通知）
- [ ] Cloud Storage 封面圖上傳
- [ ] 閱讀頁章節留言
- [ ] 閱讀設定面板（字體大小/背景色）
- [ ] PWA 支援

## 🔧 核心技術亮點

### 1. 離線優先的雲端同步架構

所有寫入操作（收藏、書籤、閱讀記錄）採用「本地優先」策略：立即更新 localStorage 保持 UI 即時響應，再於背景非同步同步至 Firestore。登入時自動執行雙向合併，確保跨裝置資料一致。

### 2. 智慧章節解析器

支援多種章節格式，包含任意中文數字：`第一章`、`第二十一章`、`序章`、`後記` 等均可正確解析。

### 3. 圖片壓縮演算法

使用 Canvas API 實作封面壓縮，自動調整至 400px 寬度，品質控制在 0.7，壓縮後約 40-50KB。

### 4. 資料合併系統

`novelsHelper.js` 優雅整合 mockData（預設小說）與 localStorage（使用者上傳），所有頁面透過統一介面存取，不需關心資料來源。

## 📝 開發心得

這是我第一個完整的全端專案，從零開始學習 React 和 Firebase 整合。在開發過程中：

1. **掌握了 React Hooks** - 深入理解 useState、useEffect、useRef、useMemo 的使用時機
2. **學會了 Firebase 整合** - Authentication 登入流程、Firestore CRUD 與 Security Rules
3. **設計了離線優先架構** - localStorage 快取 + Firestore 背景同步，兼顧速度與持久化
4. **重視使用者體驗** - 護眼配色、自動分頁、智慧書籤、即時同步提示
5. **建立了工程思維** - Feature branch 開發流程、元件化設計、工具函式抽離

## 📄 授權

本專案採用 [MIT License](LICENSE) 授權

## 👨‍💻 作者

**Du-22**

- GitHub: [@Du-22](https://github.com/Du-22)
- 專案連結: [https://github.com/Du-22/pr-novel](https://github.com/Du-22/pr-novel)

---

⭐ 如果這個專案對你有幫助，歡迎給個 Star！
