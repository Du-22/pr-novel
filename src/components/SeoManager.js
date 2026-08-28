// ============================================
// 檔案名稱: SeoManager.js
// 路徑: src/components/SeoManager.js
// 用途: 依目前路由管理頁面標題、搜尋引擎索引規則與社群分享 metadata
// ============================================

import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE_NAME = "PR小說網";
const SITE_URL = "https://pr-novel.vercel.app";
const DEFAULT_DESCRIPTION =
  "PR小說網是提供原創小說閱讀、作品分享與讀者交流的繁體中文小說平台。";
const DEFAULT_IMAGE = `${SITE_URL}/favicon-180x180.png`;

const INDEXABLE_ROUTES = {
  "/": {
    title: "PR小說網｜原創小說閱讀與創作平台",
    description: DEFAULT_DESCRIPTION,
  },
  "/tags": {
    title: "小說標籤｜PR小說網",
    description: "依照題材與標籤探索 PR小說網上的原創小說作品。",
  },
  "/ranking/views": {
    title: "人氣小說排行榜｜PR小說網",
    description: "查看 PR小說網的人氣小說排行榜，探索近期受到讀者關注的作品。",
  },
  "/ranking/favorites": {
    title: "收藏小說排行榜｜PR小說網",
    description: "查看 PR小說網的收藏小說排行榜，發現讀者喜愛的原創小說。",
  },
  "/ranking/new": {
    title: "新書排行榜｜PR小說網",
    description: "查看 PR小說網的新書排行榜，探索最近上架的原創小說。",
  },
};

const PRIVATE_ROUTE_TITLES = [
  [/^\/auth\/?$/, "登入與註冊｜PR小說網"],
  [/^\/search\/?$/, "搜尋小說｜PR小說網"],
  [/^\/upload\/?$/, "上傳小說｜PR小說網"],
  [/^\/my-uploads(?:\/|$)/, "我的上傳｜PR小說網"],
  [/^\/profile(?:\/|$)/, "個人中心｜PR小說網"],
  [/^\/notifications\/?$/, "通知｜PR小說網"],
  [/^\/admin\/?$/, "管理員後台｜PR小說網"],
  [/^\/user(?:\/|$)/, "使用者頁面｜PR小說網"],
  [/^\/novel(?:\/|$)/, "小說閱讀｜PR小說網"],
];

const setMeta = (selector, attributes) => {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([name, value]) => {
    element.setAttribute(name, value);
  });
};

const setCanonical = (url) => {
  let canonical = document.head.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    document.head.appendChild(canonical);
  }
  canonical.setAttribute("href", url);
};

const setStructuredData = (isHomePage) => {
  const existing = document.getElementById("site-structured-data");
  if (!isHomePage) {
    existing?.remove();
    return;
  }

  const script = existing || document.createElement("script");
  script.id = "site-structured-data";
  script.type = "application/ld+json";
  script.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: `${SITE_URL}/`,
        name: SITE_NAME,
        description: DEFAULT_DESCRIPTION,
        inLanguage: "zh-TW",
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        logo: {
          "@type": "ImageObject",
          url: DEFAULT_IMAGE,
        },
      },
    ],
  });

  if (!existing) document.head.appendChild(script);
};

export const getRouteMetadata = (pathname) => {
  const normalizedPath = pathname !== "/" ? pathname.replace(/\/$/, "") : "/";
  const publicRoute = INDEXABLE_ROUTES[normalizedPath];

  if (publicRoute) {
    return {
      ...publicRoute,
      canonical: `${SITE_URL}${normalizedPath === "/" ? "/" : normalizedPath}`,
      robots: "index, follow",
    };
  }

  const privateRoute = PRIVATE_ROUTE_TITLES.find(([pattern]) =>
    pattern.test(normalizedPath)
  );

  return {
    title: privateRoute?.[1] || "找不到頁面｜PR小說網",
    description: DEFAULT_DESCRIPTION,
    canonical: `${SITE_URL}${normalizedPath}`,
    robots: "noindex, nofollow",
  };
};

export const applySeoMetadata = (pathname) => {
  const metadata = getRouteMetadata(pathname);
  const isIndexable = metadata.robots.startsWith("index");

  document.title = metadata.title;
  setMeta('meta[name="description"]', {
    name: "description",
    content: metadata.description,
  });
  setMeta('meta[name="robots"]', {
    name: "robots",
    content: metadata.robots,
  });
  setMeta('meta[property="og:title"]', {
    property: "og:title",
    content: metadata.title,
  });
  setMeta('meta[property="og:description"]', {
    property: "og:description",
    content: metadata.description,
  });
  setMeta('meta[property="og:url"]', {
    property: "og:url",
    content: metadata.canonical,
  });
  setMeta('meta[name="twitter:title"]', {
    name: "twitter:title",
    content: metadata.title,
  });
  setMeta('meta[name="twitter:description"]', {
    name: "twitter:description",
    content: metadata.description,
  });
  setCanonical(metadata.canonical);
  setStructuredData(pathname === "/" && isIndexable);
};

const SeoManager = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    applySeoMetadata(pathname);
  }, [pathname]);

  return null;
};

export default SeoManager;
