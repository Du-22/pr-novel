# PR 小說網 — Claude Code 工作指南

> 這是一個作品集用的小說閱讀平台,由台灣開發者學習中完成。
> 本文件提供 Claude Code 所需的全部背景知識,請在每次開始任務前仔細閱讀。
> **2026-05 完成 visual system v2 全面翻新**(branch `redesign/visual-system-v2`,51 commits)。

---

## 🎯 專案簡介

PR 小說網 是一個以 React 開發的單頁應用小說閱讀平台,具備上傳、閱讀、收藏、書籤、排行榜、留言、評分、通知、搜尋、檢舉處理等完整功能,並配有完整的 design system(包含 dark mode)。是開發者學習程式 + 作品集用途的展示專案。

---

## 🛠 技術棧

| 層次 | 技術 |
|------|------|
| UI 框架 | React 19 (Hooks) |
| 路由 | React Router 7 |
| 樣式 | Tailwind CSS 3 + 自訂 token system + Dark mode (`darkMode: "class"`) |
| Icons | lucide-react |
| 字型 | Noto Sans TC (UI 黑體) + Noto Serif TC (內文宋體) + Plus Jakarta Sans (英文) + SC fallback |
| 資料儲存 | Firebase Firestore + localStorage(混合) |
| 認證 | Firebase Authentication |
| 圖片處理 | Canvas API(自製封面壓縮) |
| 部署 | Vercel |

---

## 📂 專案結構

```
src/
├── components/
│   ├── Navbar.js              # 全站導覽列(半透明白 + dark mode toggle)
│   ├── Footer.js              # 全站頁尾(Logo + tagline + copyright)
│   ├── Logo.js                # PR Monogram SVG 字標,可重複用
│   ├── DefaultCover.js        # 程式生成封面(書名 hash → 8 種漸層 + 直書書名)
│   ├── HeroSection.js         # 首頁 Hero 區塊(紫色 brand moment + 雙 CTA)
│   ├── CoverFlowShelf.js      # 首頁本期強推 3D 書架(含 .css)— 中央 3D 書 + 側邊書脊 + 響應式
│   ├── NovelCard.js           # 小說卡片(grid 模式)
│   ├── NovelListItem.js       # 小說卡片(list 模式)
│   ├── RankingCard.js         # 排行榜卡片(含 1/2/3 金銀銅徽章)
│   ├── SubRankingPage.js      # 子排行榜共用版型(新書/收藏/人氣)
│   ├── ViewToggle.js          # grid/list 視圖切換
│   ├── ConfirmDialog.js       # 通用確認 dialog
│   ├── ChangePasswordDialog.js
│   ├── CommentsSection.js     # 留言區(樓層 + 巢狀回覆 + @mention + 按讚 + 檢舉)
│   ├── RatingDisplay.js       # 評分純展示(lucide Star)
│   ├── RatingInput.js         # 評分互動輸入
│   ├── Skeleton.js            # Loading skeleton 集合
│   ├── ScrollToTop.js
│   ├── profile/
│   │   ├── MyFavorites.js
│   │   ├── MyWorks.js
│   │   └── ReadingHistory.js
│   └── upload/
│       ├── TxtUploadSection.js
│       ├── ChapterPreview.js
│       ├── CoverUploadSection.js  # 接 title/author 即時 DefaultCover 預覽
│       ├── BasicInfoForm.js
│       ├── ChapterInfo.js
│       ├── EditNotice.js
│       └── AddChapterSection.js
├── pages/                     # 所有頁面(略,參考下方路由對照表)
├── hooks/
│   ├── useAuth.js             # 登入狀態
│   ├── useDarkMode.js         # Dark mode toggle(localStorage 持久化 + 跟隨系統)
│   └── useUnreadNotifications.js
├── firebase/                  # Firebase 操作 (auth/novels/comments/notifications/reports/...)
├── utils/                     # 工具函式 (parser/managers/...)
└── data/
    └── mockData.js            # 開發用 mock(實際資料源是 Firestore)
```

---

## 🗺 路由對照表

| 路徑 | 頁面 |
|------|------|
| `/` | 首頁 (HomePage) |
| `/novel/:id` | 小說詳情頁 |
| `/novel/:id/read/:chapter` | 閱讀頁 |
| `/tags` | 標籤篩選頁 |
| `/search` | 搜尋結果頁 |
| `/ranking` | 排行榜總覽 |
| `/ranking/views` | 人氣榜 Top 30 |
| `/ranking/favorites` | 收藏榜 Top 30 |
| `/ranking/new` | 新書榜 Top 30 |
| `/upload` | 上傳小說 |
| `/my-uploads` | 我的上傳管理 |
| `/my-uploads/edit/:id` | 編輯小說 |
| `/my-uploads/edit/:id/chapter/:chapterNumber` | 編輯單一章節 |
| `/profile` | 個人中心(含收藏/作品/閱讀記錄 tab) |
| `/notifications` | 通知列表 |
| `/user/:uid` | 公開使用者頁(其他人的個人頁) |
| `/auth` | 登入/註冊 |
| `/admin` | 管理員後台(檢舉處理) |
| `*` | NotFoundPage(404) |

---

## 🎨 配色規範 (visual system v2)

### Brand 與 Accent

```javascript
// tailwind.config.js
primary: {                     // 紫色主色 + 完整色階
  DEFAULT: "#6C5CE7",
  dark:    "#5849D6",          // dark mode 自動降一階
  light:   "#8E80EE",
  50: "#F4F2FE", 100: "#E5E1FC", ..., 900: "#2D2570",
}
warm: {                        // 暖黃 accent — 唯一暖色,用於收藏按鈕等強調點
  DEFAULT: "#FFB800",
  light:   "#FFE082",
  50:      "#FFF8E1",
}
```

### Neutral(灰階)

```javascript
neutral: {                     // 取代散落的 Tailwind 預設 gray-*
  0: "#FFFFFF", 50: "#FAFAFA", ..., 900: "#18181B"
}
```

### 狀態色

```javascript
success: { DEFAULT: "#10B981", light: "#D1FAE5" }   // 綠 — 連載中、成功訊息
warning: { DEFAULT: "#F59E0B", light: "#FEF3C7" }   // 橘 — 待處理檢舉、舊格式提示
danger:  { DEFAULT: "#EF4444", light: "#FEE2E2" }   // 紅 — 刪除按鈕、已刪除留言
info:    { DEFAULT: "#3B82F6", light: "#DBEAFE" }   // 藍 — 完結標籤、回覆通知、Info 提示
```

### 閱讀頁背景

```javascript
reading: {
  light: "#FEFDFB",            // 紙白色
  dark:  "#1A1A1D",            // 深紙色 (dark mode)
}
```

### 字型 utility

```javascript
fontFamily: {
  heading: ['"Noto Sans TC"', '"Noto Sans SC"', '"Plus Jakarta Sans"', "sans-serif"],
  body:    ['"Noto Serif TC"', '"Noto Serif SC"', "serif"],
}
```

### 已棄用但保留的舊 token

`secondary` `accent` `pink` `dark` `light` 仍在 config 但**不要在新元件用**。
這些是翻新前的舊 token,等所有引用清光才會從 config 移除。

---

## 📐 UI/UX 規則 (visual system v2)

### Logo 與品牌

- **Logo 是 `<Logo />` SVG component**(PR Monogram 自訂字標),不再用 emoji 或 PNG
- **品牌主色紫 `#6C5CE7`**(可換色階,不可換色相)
- **Hero 是整頁唯一的紫色 brand moment** — 其他段落用 neutral 灰,讓紫色更有份量

### 元件視覺一致性

- **Card pattern**: `rounded-2xl + border border-neutral-200 + dark variants`
  (取代原本 `rounded-lg shadow-md`,subtle 邊框比 shadow 更精緻)
- **Tab pattern**: segmented control(灰底容器 + 白卡 active),全站一致
- **Dialog pattern**: `rounded-2xl + shadow-2xl + backdrop-blur-sm`
- **Tag pattern**: `bg-neutral-100 text-neutral-700`(不要用紫框 / 紫底紫字)
- **Status badge**: `bg-info-light/text-info`(完結)、`bg-success-light/text-success`(連載)
- **「使用說明」card**: subtle info card(`bg-info-light/40 border-info/20`)+ lucide Info icon

### 文字

- **無 emoji**(整套 UI 全清)
- **小說卡片不顯示數字統計**(瀏覽數、收藏數)
- **閱讀頁**: `max-w-[800px]`、`leading-[1.85]`、`text-[1.1rem] sm:text-[1.15rem]`、**`font-body`(Noto Serif TC 宋體)**
- **Drop cap**: 閱讀頁第一頁第一段首字放大 3.6em + 黑體 + float left,**繼承內文色不上紫**(呼應「Hero 是唯一紫色 moment」原則)
- **長文加** `break-words`、`text-wrap: pretty`
- **日期格式** `YYYY/MM/DD`(不使用相對時間)

### Icons

- **一律用 lucide-react**(已棄用 unicode 字元 ↩ ♥ ✕ 等與手寫 inline SVG)
- 通知圖示對應(可重複使用):
  - `reply` → `Reply` + `bg-info-light text-info`
  - `report` → `Flag` + `bg-warning-light text-warning`
  - `comment_deleted` → `X` + `bg-danger-light text-danger`
  - `report_resolved` → `Check` + `bg-success-light text-success`
  - `like` → `Heart` + `bg-warm-50 text-warm`

### 響應式

- Mobile: 卡片 grid 通常 `grid-cols-2`
- md (768px+): `md:grid-cols-3`
- lg (1024px+): `lg:grid-cols-4`
- 本期強推橫滾: 卡片寬 `w-[170px] sm:w-[220px] md:w-[280px]`(經 iPhone 14 Pro Max 校正)
- 詳情頁: `md:grid-cols-[280px_1fr]`(cover + info)

### Dark mode

- 透過 `<html class="dark">` 觸發(Tailwind `darkMode: "class"`)
- Navbar 月亮 / 太陽 icon 切換,`useDarkMode` hook 持久化到 localStorage(key: `pr-novel-theme`)
- 首次進站若無記錄,跟隨系統 `prefers-color-scheme`
- `public/index.html` 有 inline script 抗 FOUC(React render 之前先設好 class)
- **寫新元件一律加 `dark:` variants**(`dark:bg-neutral-900 dark:text-neutral-100` 等)

---

## 🔑 重要開發規則

### 1. 每個檔案開頭必須有註解

```javascript
// ============================================
// 檔案名稱: NovelCard.js
// 路徑: src/components/NovelCard.js
// 用途: 小說卡片(grid 模式)— 顯示封面、標題、作者、簡介、標籤
// ============================================
```

### 2. 永遠用 `novelsHelper.js` 而不是直接讀資料

```javascript
import { getAllNovels, getNovelById, getAllTags } from '../utils/novelsHelper';
```

### 3. 使用 useAuth / useDarkMode 等 custom hooks

```javascript
import { useAuth } from '../hooks/useAuth';
import { useDarkMode } from '../hooks/useDarkMode';

const { user, loading } = useAuth();
const { isDark, toggle } = useDarkMode();
```

### 4. Firebase Auth 函式

```javascript
import { loginWithEmail, registerWithEmail, loginWithGoogle, logout, resetPassword } from '../firebase/auth';
```

### 5. 新元件規範(visual system v2)

- 用新 token(primary/warm/neutral/state),**不要用舊的** secondary/pink/accent/dark/light
- Card 用 `rounded-2xl + border` 樣式,不要用 `shadow-md`
- 全面加 `dark:` variants
- 響應式: mobile-first + `sm:` / `md:` / `lg:` 斷點
- 圖示用 `lucide-react`,不要手寫 SVG 或用 unicode 字元
- 表單欄位抽出 `INPUT_CLASS` 常數共用(參考 BasicInfoForm / ChangePasswordDialog)
- Tab 切換用 segmented control 樣式

---

## 📦 localStorage 儲存結構

| Key | 用途 |
|-----|------|
| `uploadedNovels` | 使用者上傳的小說(完整內容) |
| `userFavorites` | 收藏清單 `[{ novelId, timestamp }]` |
| `bookmarks` | 書籤 `{ novelId: { chapter, page, timestamp } }` |
| `readHistory` | 已讀章節 `{ novelId: [chapterNumbers] }` |
| `novelStats` | 統計數據 `{ novelId: { views, favorites } }` |
| `pr-novel-theme` | dark mode 偏好(`"light"` / `"dark"`) |

sessionStorage 也用了一個:
| Key | 用途 |
|-----|------|
| `tagsSortBy` | TagsPage 排序記憶 |

---

## 🔥 Firebase 設定

環境變數放在 `.env`(不上傳 Git):

```
REACT_APP_FIREBASE_API_KEY=...
REACT_APP_FIREBASE_AUTH_DOMAIN=...
REACT_APP_FIREBASE_PROJECT_ID=...
REACT_APP_FIREBASE_STORAGE_BUCKET=...
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...
REACT_APP_FIREBASE_APP_ID=...
REACT_APP_FIREBASE_MEASUREMENT_ID=...
```

---

## ✅ 已完成功能

- 首頁(Hero + 本期強推 Cover Flow 3D 書架 + 隨機標籤橫滾 + Footer)
- 詳情頁(DefaultCover、章節目錄、暖黃收藏按鈕、評分、相似推薦、留言)
- 閱讀頁(宋體內文 + drop cap + 紙白底 + 章節導航)
- 排行榜總覽 + 3 子榜(Top 30)
- 標籤篩選(多選 + AND 邏輯)
- 上傳(TXT 解析 + 封面壓縮 + DefaultCover 即時預覽)
- 我的上傳管理 + 編輯小說 + 編輯單一章節 + 舊格式遷移
- 個人中心(收藏/作品/閱讀記錄 tab + 暱稱/簡介編輯 + 更改密碼)
- 公開使用者頁(他人個人頁)
- Firebase Authentication(Email / Google + 忘記密碼)
- 留言系統(樓層、巢狀回覆、@mention、按讚、刪除、檢舉、軟刪除)
- 評分系統(1-5 星)
- 通知系統(回覆 / 按讚 / 檢舉 / 刪除 / 已處理)
- 搜尋(標題 / 作者 / 標籤)
- 管理員後台(檢舉列表 + 處理流程)
- **Visual system v2**(全站重新套設計 token + dark mode + lucide icons + 移除 AI 味)
- **Dark mode toggle**(navbar 切換按鈕 + 持久化 + 抗 FOUC)
- **DefaultCover**(8 種漸層,書名 hash 對應,自動配 dark mode)
- **Cover Flow 3D 書架**(首頁本期強推 — 中央 3D 立體書 + idle 旋轉動畫 + 兩側書脊 + 鍵盤/swipe 切換 + 響應式三組 config + dark mode 自動偵測)
- **PR Monogram Logo**(自訂 SVG 字標,取代原本生成 PNG)
- **Noto Sans TC + Noto Serif TC** 字型系統(SC fallback)

## 🚧 待開發 / 後續可做

- Firestore 雲端同步(收藏/書籤/閱讀記錄,目前只在 localStorage)
- localStorage → Firestore 遷移腳本實際執行
- Cloud Storage 小說檔案上傳(目前 chapters 直接存在 Firestore)
- 進階搜尋(全文檢索)
- 推薦演算法(個人化推薦)
- PWA 完整支援(離線閱讀)
- 通知推播(Firebase Cloud Messaging)
- 移除已棄用的舊 token(`secondary` / `pink` / `dark` / `light`)— 等所有 component 完全不再引用
- Mobile app 版本(React Native 改寫)

---

## 💡 常見陷阱提醒

1. **不要直接 import mockData** — 一律用 `novelsHelper.js`
2. **舊 token 仍在 config 但不要用** — 新元件用 primary/warm/neutral/state 系列
3. **章節解析支援任意中文數字** — 第一章、第二十一章、第九十九章都 OK
4. **上傳小說有兩個 id**:`id`(本地 localStorage)與 `firestoreId`(Firestore)。
   navigate 時優先用 `firestoreId || id`(否則「找不到小說」)
5. **`.env` 不可上傳 Git** — 已在 `.gitignore` 設定
6. **視圖統計邏輯** — 每次進詳情頁都 +1,不限制重複瀏覽
7. **封面壓縮規格** — 寬度 400px、品質 0.7、約 40-50KB
8. **無封面小說自動用 DefaultCover** — 顯示時偵測 `coverImage === DEFAULT_COVER_PATH`
9. **Dark mode 手動測試**:`document.documentElement.classList.add('dark')`
10. **Tailwind dark variant 必加**:寫新元件時對應 `dark:bg-...` `dark:text-...` `dark:border-...`
11. **lucide icon 名稱命名**:大駝峰(`Search` `Bell`),不是 kebab-case
12. **Card 樣式統一用 `rounded-2xl + border + dark`**:`p-5 sm:p-6`(內距響應式)

---

## 🔄 開發完成後的標準流程

1. 功能測試通過(參考下方測試清單)
2. 確認所有新增檔案都有開頭三行式註解
3. 更新 `README.md`(重大功能才需要)
4. 更新本 CLAUDE.md(新元件 / 新 pattern / 重要架構決策)
5. **最後才執行 `git commit` + `git push`**

### Phase 開始前的規劃確認

> **在開始任何新 Phase 之前,必須先與使用者討論並確認該 Phase 的完整規劃範圍。**
> 列出預計要做的所有功能,等使用者明確確認後才開始動工。
> 不可自行決定 Phase 的內容範圍。

### Commit 預設行為

> **在執行 commit 之前,必須先詢問使用者是否準備好 commit**(讓使用者有機會先測試)。
> 使用者確認後,一次完整執行:`git commit` → `git push` → `gh pr create` → `gh pr merge`
> 除非使用者明確說「不要 push」或「不要合併」,才只執行對應步驟。
> **注意**:這條規則適用於完成的功能,不適用於進行中的 branch(中間步驟只 commit 即可,
> 等整個 branch 完成才 push + PR + merge)。

---

## 🧪 功能測試清單

每次完成功能後,依序驗證:

- [ ] 首頁正常載入(Hero 紫色塊 / 本期強推 / 隨機標籤 / Footer)
- [ ] 小說詳情頁(封面或 DefaultCover、章節目錄 lucide Check、暖黃收藏按鈕、相似推薦)
- [ ] 閱讀頁(宋體內文、drop cap、章節導航、紙白色背景)
- [ ] 上傳 TXT(解析章節、封面壓縮 / DefaultCover 即時預覽)
- [ ] 我的上傳(列表 / 編輯 / 刪除,點查看詳情正確跳轉)
- [ ] 個人中心(收藏 / 作品 / 閱讀記錄 三個 tab + 編輯暱稱 + 編輯 bio)
- [ ] 排行榜(總覽 segmented + 3 子榜)
- [ ] 標籤篩選(多選 / 清空 / 展開收起)
- [ ] 搜尋(切換類別 / 結果顯示)
- [ ] 通知頁(整列底色標未讀 + lucide icons)
- [ ] 留言區(樓層 / 回覆 / 按讚 lucide Heart / 檢舉 / 刪除)
- [ ] 評分(點 lucide Star 評分 / 修改)
- [ ] 登入 / 註冊(Email / Google / 忘記密碼)
- [ ] **Dark mode 切換**(navbar 月亮/太陽 icon、整頁切換、F5 後保留)
- [ ] 響應式(iPhone 14 Pro Max 430px / iPhone SE 375px / 桌面)
- [ ] Console 無 error / 無 warning(manifest 與字型載入正常)

---

## 🔙 回滾機制

```bash
git reset --hard HEAD~1  # 回到上一個 commit
git push -f              # 強制推送(僅限 feature/fix 分支,main 絕對禁止)
```

---

## 📝 Commit Message 規範

```
feat: 新增 dark mode toggle
fix: 修正 MyUploadsPage 點詳情找不到小說的問題
docs: 更新 README 說明
refactor: 將排行榜子頁抽成 SubRankingPage 共用元件
chore: 移除 production 不需要的 console.log
```

---

## 💻 輸出格式規則

- **直接修改本地檔案**,不需要額外下載流程
- 修改完成後說明放置路徑與 import 路徑
- 只有在討論片段程式碼或說明概念時才用 Markdown 程式碼區塊

---

*最後更新: 2026-05-04(visual system v2 翻新完成,branch `redesign/visual-system-v2` 共 51 commit)*

---

## 🔄 設計規則的再檢視授權(翻新階段已結束)

本專案於 2026-05-03 ~ 05-04 透過 web-design-engineer skill 完成 visual system v2 全面翻新:
從新 token system、Logo / DefaultCover / Footer 抽元件、navbar 半透明白底、宋體閱讀內文、
warm accent 收藏按鈕、dark mode 完整支援等,共 51 個 commit。

### 後續維護方針

- **新元件 / 新頁面**:照本文件「📐 UI/UX 規則」實作(Card / Tab / Dialog / Token / dark / lucide)
- **既有元件改動**:盡量不破壞翻新後的視覺一致性,refactor 時也順手套新 token
- **若再次發現「AI 味」**(漸層左色條、紫粉漸層、emoji 當 icon、亂用 secondary/pink 等),
  歡迎再次啟動 web-design-engineer skill 提案改善
- **舊 token 完全清掉**:當所有 component 都不再引用 `secondary` / `pink` / `dark` / `light`,
  可從 `tailwind.config.js` 移除這四個棄用 token
