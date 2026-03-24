# 📚 PR 小說網

一個以 React 與 Firebase 打造的全端小說閱讀平台，提供閱讀、上傳、收藏、社群留言等完整功能。

**Live Demo：[https://pr-novel.vercel.app](https://pr-novel.vercel.app)**

---

## 截圖

<!-- 請補充以下截圖，建議尺寸 1280×720 或 16:9 比例 -->

| 首頁 | 小說詳情頁 |
|------|-----------|
| ![首頁截圖](docs/screenshots/home.png) | ![詳情頁截圖](docs/screenshots/detail.png) |

| 閱讀頁 | 個人中心 |
|--------|---------|
| ![閱讀頁截圖](docs/screenshots/reading.png) | ![個人中心截圖](docs/screenshots/profile.png) |

| 留言系統 | 管理員後台 |
|---------|----------|
| ![留言截圖](docs/screenshots/comments.png) | ![後台截圖](docs/screenshots/admin.png) |

---

## 功能特色

### 閱讀體驗
- 小說列表、詳情頁、分頁閱讀（每頁 3000 字）
- 章節目錄 + 已讀章節標記（✓）
- 自動記錄上次讀到的章節，下次直接繼續閱讀
- 護眼閱讀背景色（#FEFDFB）

### 使用者功能
- Email / Google 登入、忘記密碼
- 收藏小說、個人閱讀記錄
- 個人頁（收藏 / 我的作品 / 閱讀記錄）
- 暱稱、自我介紹編輯

### 社群功能
- 多層留言系統（巢狀回覆、按讚、樓層標記）
- 留言檢舉 + 管理員後台（結案 / 刪除）
- 站內通知（回覆、按讚、檢舉、刪除通知）
- 小說評分系統（1～5 顆星）
- 點擊通知直接跳轉至對應留言位置

### 內容管理
- TXT 格式小說上傳（支援中文章節解析）
- 封面圖片壓縮（Canvas API，寬 400px，品質 0.7）
- 我的上傳管理（編輯、刪除）
- 排行榜（人氣榜、收藏榜、新書榜）
- 標籤篩選（多選 AND 邏輯）
- 全站關鍵字搜尋

### 技術特色
- Firebase Auth + Firestore 直讀直寫（登入時）
- 未登入走 localStorage，登入後無縫切換
- Firestore Security Rules（含 Admin 權限）
- Skeleton Loading（詳情頁、閱讀頁、個人頁）
- 軟刪除（deleted: true）保留留言脈絡

---

## 技術棧

| 類別 | 技術 |
|------|------|
| UI 框架 | React 18 (Hooks) |
| 路由 | React Router 6 |
| 樣式 | Tailwind CSS |
| 後端 / 資料庫 | Firebase Firestore |
| 認證 | Firebase Authentication |
| 圖片處理 | Canvas API |
| 部署 | Vercel |

---

## 本地安裝

### 環境需求
- Node.js 18+
- Firebase 專案（需自行建立）

### 步驟

```bash
# 1. Clone 專案
git clone https://github.com/Du-22/pr-novel.git
cd pr-novel

# 2. 安裝套件
npm install

# 3. 設定環境變數
cp .env.example .env
# 填入你的 Firebase 設定
```

在 `.env` 填入以下變數：

```
REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_AUTH_DOMAIN=
REACT_APP_FIREBASE_PROJECT_ID=
REACT_APP_FIREBASE_STORAGE_BUCKET=
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=
REACT_APP_FIREBASE_APP_ID=
REACT_APP_FIREBASE_MEASUREMENT_ID=
```

```bash
# 4. 啟動開發伺服器
npm start
```

---

## 專案結構

```
src/
├── components/       # 共用元件（Navbar、留言系統、Skeleton...）
├── pages/            # 各頁面
├── hooks/            # useAuth 等 Custom Hooks
├── firebase/         # Firebase 設定與 CRUD 工具
├── utils/            # 工具函式（小說解析、收藏管理...）
└── data/             # 預設小說資料（mockData）
```

---

## License

MIT
