// ============================================
// 檔案名稱: UserProfilePage.js
// 路徑: src/pages/UserProfilePage.js
// 用途: 公開使用者頁面 — 顯示其他使用者的上傳作品與收藏
// ============================================

import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import NovelCard from "../components/NovelCard";
import { getUserNovels } from "../firebase/novels";
import { getSubCollectionDocs } from "../firebase/firestore";
import { getUserProfile } from "../firebase/users";
import { getAllNovels } from "../utils/novelsHelper";

export default function UserProfilePage() {
  const { uid } = useParams();
  const [activeTab, setActiveTab] = useState("uploads");
  const [uploads, setUploads] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [uploaderName, setUploaderName] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const profile = await getUserProfile(uid);
        if (!profile) {
          setNotFound(true);
          return;
        }
        setUploaderName(profile?.displayName || "");
        setBio(profile?.bio || "");

        const novels = await getUserNovels(uid);
        setUploads(novels);

        const favDocs = await getSubCollectionDocs(`favorites/${uid}`, "novels");
        const allNovels = getAllNovels();
        const favNovels = favDocs
          .map((fav) => allNovels.find((n) => n.id === fav.id))
          .filter(Boolean);
        setFavorites(favNovels);
      } catch (err) {
        console.error("載入使用者頁面失敗:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const displayName = uploaderName || "使用者";
  const initial = displayName.charAt(0).toUpperCase();

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950">
        <Navbar showBackButton={true} />
        <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-24 text-center">
          <p className="mb-4 text-lg text-neutral-500 dark:text-neutral-400">
            找不到此使用者
          </p>
          <Link
            to="/"
            className="text-sm transition-colors
                       text-primary hover:text-primary-dark hover:underline
                       dark:text-primary-light dark:hover:text-primary"
          >
            回到首頁
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const tabs = [
    { id: "uploads", label: `上傳作品 (${uploads.length})` },
    { id: "favorites", label: `收藏 (${favorites.length})` },
  ];

  const activeNovels = activeTab === "uploads" ? uploads : favorites;
  const emptyMsg =
    activeTab === "uploads"
      ? "此使用者尚未上傳任何作品"
      : "此使用者尚未收藏任何作品";

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950">
      <Navbar showBackButton={true} />

      <main className="flex-1 container mx-auto px-4 py-8 md:py-12 max-w-6xl space-y-6 md:space-y-8">
        {/* 使用者資訊 */}
        <div className="rounded-2xl border p-5 sm:p-6 flex items-center gap-4
                        bg-white border-neutral-200
                        dark:bg-neutral-900 dark:border-neutral-800">
          <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0
                          bg-primary dark:bg-primary-dark">
            <span className="text-2xl font-bold text-white">{initial}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {displayName}
            </h1>
            <p className="mb-2 text-sm text-neutral-500 dark:text-neutral-400">
              {uploads.length} 部作品 · {favorites.length} 個收藏
            </p>
            {bio && (
              <p className="text-sm break-words text-neutral-600 dark:text-neutral-400">
                {bio}
              </p>
            )}
          </div>
        </div>

        {/* Tab — segmented control */}
        <div className="rounded-xl p-1.5
                        bg-neutral-100 dark:bg-neutral-800">
          <div className="flex gap-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-white text-primary shadow-sm dark:bg-neutral-700 dark:text-primary-light"
                      : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 內容 */}
        {loading ? (
          <p className="text-center py-16 text-neutral-500 dark:text-neutral-400">
            載入中...
          </p>
        ) : activeNovels.length === 0 ? (
          <p className="text-center py-16 text-neutral-500 dark:text-neutral-400">
            {emptyMsg}
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {activeNovels.map((novel) => (
              <NovelCard key={novel.id} novel={novel} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
