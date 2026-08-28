// ============================================
// 檔案名稱: SeoManager.test.js
// 路徑: src/components/SeoManager.test.js
// 用途: 驗證公開、私人與未知路由的 SEO metadata 切換
// ============================================

jest.mock(
  "react-router-dom",
  () => ({
    useLocation: jest.fn(),
  }),
  { virtual: true }
);

const { applySeoMetadata } = require("./SeoManager");

const getMetaContent = (selector) =>
  document.head.querySelector(selector)?.getAttribute("content");

describe("SeoManager", () => {
  afterEach(() => {
    document.head
      .querySelectorAll(
        'meta[name="description"], meta[name="robots"], meta[property^="og:"], meta[name^="twitter:"], link[rel="canonical"], #site-structured-data'
      )
      .forEach((element) => element.remove());
    document.title = "";
  });

  test("首頁提供品牌 metadata 與結構化資料", () => {
    applySeoMetadata("/");

    expect(document.title).toBe("PR小說網｜原創小說閱讀與創作平台");
    expect(getMetaContent('meta[name="robots"]')).toBe("index, follow");
    expect(document.head.querySelector('link[rel="canonical"]')?.href).toBe(
      "https://pr-novel.vercel.app/"
    );
    expect(document.getElementById("site-structured-data")).not.toBeNull();
  });

  test("公開排行榜可索引且有獨立 canonical", () => {
    applySeoMetadata("/ranking/views");

    expect(getMetaContent('meta[name="robots"]')).toBe("index, follow");
    expect(document.title).toBe("人氣小說排行榜｜PR小說網");
    expect(document.head.querySelector('link[rel="canonical"]')?.href).toBe(
      "https://pr-novel.vercel.app/ranking/views"
    );
    expect(document.getElementById("site-structured-data")).toBeNull();
  });

  test("私人路由不允許建立索引", () => {
    applySeoMetadata("/my-uploads/edit/example");

    expect(getMetaContent('meta[name="robots"]')).toBe("noindex, nofollow");
    expect(document.title).toBe("我的上傳｜PR小說網");
  });

  test("未知路由標示為找不到頁面且不建立索引", () => {
    applySeoMetadata("/not-a-real-page");

    expect(document.title).toBe("找不到頁面｜PR小說網");
    expect(getMetaContent('meta[name="robots"]')).toBe("noindex, nofollow");
  });
});
