# 📚 PR 小說網 — Claude Code 工作指南

> 這是一個作品集用的小說閱讀平台，由台灣開發者學習中完成。
> 本文件提供 Claude Code 所需的全部背景知識，請在每次開始任務前仔細閱讀。

---

## 🎯 專案簡介

**PR 小說網** 是一個以 React 開發的單頁應用小說閱讀平台，具備上傳、閱讀、收藏、書籤、排行榜等功能。這是開發者第一個完整的全端專案，目前正從 localStorage 升級至 Firebase Firestore。

---

## 🛠 技術棧

| 層次 | 技術 |
|------|------|
| UI 框架 | React 18 (Hooks) |
| 路由 | React Router 6 |
| 樣式 | Tailwind CSS (紫色系配色) |
| 資料儲存 | localStorage (現況) → Firebase Firestore (升級中) |
| 認證 | Firebase Authentication |
| 圖片處理 | Canvas API (自製封面壓縮) |

---

## 📂 專案結構

```
src/
├── components/
│   ├── Navbar.js              # 導覽列，已整合登入狀態
│   ├── NovelCard.js           # 小說卡片
│   ├── RankingCard.js         # 排行榜卡片
│   ├── ConfirmDialog.js       # 確認對話框
│   ├── profile/
│   │   ├── MyFavorites.js     # 我的收藏 tab
│   │   ├── MyWorks.js         # 我的作品 tab
│   │   └── ReadingHistory.js  # 閱讀記錄 tab
│   └── upload/
│       ├── TxtUploadSection.js
│       ├── ChapterPreview.js
│       ├── CoverUploadSection.js
│       ├── BasicInfoForm.js
│       ├── ChapterInfo.js
│       └── EditNotice.js
├── pages/
│   ├── HomePage.js
│   ├── NovelDetailPage.js     # 詳情頁，含收藏功能
│   ├── ReadingPage.js         # 閱讀頁，含書籤
│   ├── RankingPage.js
│   ├── ViewsRankingPage.js
│   ├── FavoritesRankingPage.js
│   ├── NewRankingPage.js
│   ├── TagsPage.js
│   ├── UploadPage.js
│   ├── MyUploadsPage.js
│   ├── EditUploadPage.js
│   ├── ProfilePage.js
│   └── AuthPage.js
├── hooks/
│   └── useAuth.js             # 登入狀態管理 Custom Hook
├── firebase/
│   ├── config.js              # Firebase 初始化
│   ├── auth.js                # 登入/註冊功能
│   ├── firestore.js           # Firestore CRUD 工具
│   └── novels.js              # 小說相關 Firestore 操作
├── utils/
│   ├── parser.js              # 章節解析器（支援中文數字）
│   ├── bookmarkManager.js     # 書籤管理
│   ├── readHistoryManager.js  # 已讀記錄管理
│   ├── statsManager.js        # 統計數據管理
│   ├── novelsHelper.js        # 資料合併工具（核心！）
│   ├── uploadedNovelsManager.js
│   ├── imageCompressor.js
│   └── favoritesManager.js
└── data/
    └── mockData.js            # 15 本預設小說資料
```

---

## 🗺 路由對照表

| 路徑 | 頁面 |
|------|------|
| `/` | 首頁 |
| `/tags` | 標籤篩選頁 |
| `/novel/:id` | 小說詳情頁 |
| `/read/:id/:chapter` | 閱讀頁 |
| `/upload` | 上傳頁 |
| `/my-uploads` | 我的上傳 |
| `/edit-upload/:id` | 編輯上傳 |
| `/profile` | 個人中心 |
| `/ranking` | 排行榜 |
| `/auth` | 登入/註冊 |

---

## 🎨 配色規範

```javascript
// tailwind.config.js 自訂色彩
primary:   "#6C5CE7"  // 主色，優雅紫
secondary: "#A29BFE"  // 次色，淡紫
pink:      "#6C5CE7"  // 收藏按鈕（改為紫色，與 primary 相同）
dark:      "#2D3436"  // 深灰
light:     "#F8F9FA"  // 淺灰白
// 閱讀頁背景：#FEFDFB（護眼色）
```

---

## 📐 UI/UX 規則

- **無 emoji**，除了 Logo「📚 PR 小說網」
- **小說卡片不顯示數字統計**（瀏覽數、收藏數）
- **閱讀頁最大寬度** `max-w-[800px]`
- **閱讀頁行距** `leading-[1.8]`、字體 `text-[1.1rem]`
- **標籤樣式** 圓角膠囊 `rounded-full`
- **長文必須加** `break-words`（標題、簡介）
- **日期格式** `YYYY/MM/DD`，不使用相對時間（X 天前）
- **Navbar** 紫色漸層背景

---

## 🔑 重要開發規則

### 1. 每個檔案開頭必須有註解

```javascript
// ============================================
// 檔案名稱: NovelCard.js
// 路徑: src/components/NovelCard.js
// 用途: 小說卡片元件（顯示封面、標題、作者、簡介、標籤）
// ============================================
```

### 2. 所有頁面必須支援雙資料來源

**永遠使用 `novelsHelper.js` 提供的函式，不要直接讀 mockData：**

```javascript
import { getAllNovels, getNovelById, getAllTags } from '../utils/novelsHelper';
```

這個工具會自動合併：
- `mockData`（15 本預設小說）
- `localStorage`（使用者上傳的小說）

### 3. 登入狀態使用 useAuth Hook

```javascript
import { useAuth } from '../hooks/useAuth';

const { user, loading } = useAuth();
```

### 4. Firebase Auth 函式

```javascript
import { loginWithEmail, registerWithEmail, loginWithGoogle, logout, resetPassword } from '../firebase/auth';
```

---

## 📦 localStorage 儲存結構

| Key | 用途 |
|-----|------|
| `uploadedNovels` | 使用者上傳的小說（完整內容） |
| `userFavorites` | 收藏清單 `[{ novelId, timestamp }]` |
| `bookmarks` | 書籤 `{ novelId: { chapter, page, timestamp } }` |
| `readHistory` | 已讀章節 `{ novelId: [chapterNumbers] }` |
| `novelStats` | 統計數據 `{ novelId: { views, favorites } }` |

---

## 🔥 Firebase 設定

環境變數放在 `.env`（不上傳 Git）：

```
REACT_APP_FIREBASE_API_KEY=...
REACT_APP_FIREBASE_AUTH_DOMAIN=...
REACT_APP_FIREBASE_PROJECT_ID=...
REACT_APP_FIREBASE_STORAGE_BUCKET=...
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...
REACT_APP_FIREBASE_APP_ID=...
REACT_APP_FIREBASE_MEASUREMENT_ID=...
```

### Firestore 資料結構（規劃中）

```
favorites/{userId}/novels/{novelId}/
  └── timestamp: Timestamp

bookmarks/{userId}/novels/{novelId}/
  ├── chapter: number
  ├── page: number
  └── timestamp: Timestamp

readHistory/{userId}/novels/{novelId}/
  ├── readChapters: number[]
  └── lastRead: Timestamp

novels/{novelId}/
  ├── title, author, summary, tags
  ├── coverImage, txtFile, createdAt
  └── stats: { views, favorites }
```

---

## ✅ 已完成功能

- 首頁、詳情頁、閱讀頁
- 書籤系統、已讀記錄、收藏系統
- 排行榜系統（人氣/收藏/新書 3 個榜單）
- 標籤篩選頁（多選 + AND 邏輯）
- 上傳頁（TXT 解析 + 封面壓縮）
- 我的上傳管理（列表/編輯/刪除）
- 個人頁（收藏/作品/閱讀記錄 tab）
- Firebase Authentication（Email / Google 登入、忘記密碼）
- Firestore 前置準備（CRUD 工具、Security Rules、資料結構設計）

## 🚧 待開發

- Firestore 資料同步（收藏/書籤/閱讀記錄雲端同步）
- localStorage → Firestore 遷移腳本執行
- 評論系統
- 搜尋功能
- Cloud Storage 小說檔案上傳

---

## 💡 常見陷阱提醒

1. **不要直接 import mockData** — 一律用 `novelsHelper.js`
2. **配色是紫色系** — 不是粉紅色，`pink` 已被覆蓋為紫色
3. **NovelDetailPage 約 340 行** — 正常，不需拆分
4. **章節解析支援任意中文數字** — 第一章、第二十一章、第九十九章都 OK
5. **上傳小說 id 前綴是** `uploaded-`，mockData 是 `novel-`
6. **`.env` 不可上傳 Git** — 已在 `.gitignore` 設定
7. **視圖統計邏輯** — 每次進詳情頁都 +1，不限制重複瀏覽
8. **封面壓縮規格** — 寬度 400px、品質 0.7、約 40-50KB

---

## 🔄 開發完成後的標準流程

1. 功能測試通過（參考下方測試清單）
2. 確認所有新增檔案都有開頭註解
3. 更新 `PROJECT_STATUS_UPDATED.md`
4. 更新 `QUICK_START.md`
5. 更新 `README.md`（重大功能才需要）
6. **最後才執行 `git commit` + `git push`**

### Phase 開始前的規劃確認

> **在開始任何新 Phase 之前，必須先與使用者討論並確認該 Phase 的完整規劃範圍。**
> 列出預計要做的所有功能，等使用者明確確認後才開始動工。
> 不可自行決定 Phase 的內容範圍。

### Commit 預設行為

> **在執行 commit 之前，必須先詢問使用者是否準備好 commit（讓使用者有機會先測試）。**
> 使用者確認後，一次完整執行：`git commit` → `git push` → `gh pr create` → `gh pr merge`
> 除非使用者明確說「不要 push」或「不要合併」，才只執行對應步驟。

---

## 🧪 功能測試清單

每次完成功能後，依序驗證：

- [ ] 首頁正常載入（本期強推、標籤專區）
- [ ] 小說詳情頁（封面、章節目錄、收藏按鈕）
- [ ] 閱讀頁（內容顯示、書籤、已讀標記、翻頁）
- [ ] 上傳 TXT（解析章節、封面壓縮、儲存到 localStorage）
- [ ] 我的上傳（列表顯示、編輯、刪除）
- [ ] 個人頁（收藏 tab、作品 tab、閱讀記錄 tab）
- [ ] 排行榜（三個榜單正常顯示）
- [ ] 標籤篩選（多選、AND 邏輯正確）
- [ ] 登入/註冊（Email、Google 登入、忘記密碼）
- [ ] Navbar 登入狀態（未登入顯示登入按鈕、已登入顯示選單）

---

## 🔙 回滾機制

```bash
git reset --hard HEAD~1  # 回到上一個 commit
git push -f              # 強制推送（謹慎使用）
```

---

## 📝 Commit Message 規範

```
feat: 新增 Firestore 收藏同步功能
fix: 修正閱讀頁書籤儲存問題
docs: 更新 README 說明
style: 調整排行榜卡片樣式
refactor: 重構 novelsHelper 合併邏輯
```

---

## 💻 輸出格式規則

- **直接修改本地檔案**，不需要額外下載流程
- 修改完成後說明放置路徑與 import 路徑
- 只有在討論片段程式碼或說明概念時才用 Markdown 程式碼區塊

---

*最後更新：2024-12-18 | 專案完成度約 70%*
