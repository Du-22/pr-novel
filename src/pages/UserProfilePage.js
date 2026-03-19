// ============================================
// 檔案名稱: UserProfilePage.js
// 路徑: src/pages/UserProfilePage.js
// 用途: 公開使用者頁面（顯示上傳作品與收藏）
// ============================================
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
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
        // 取得使用者公開資料（顯示名稱、簡介）
        const profile = await getUserProfile(uid);
        if (!profile) {
          setNotFound(true);
          return;
        }
        setUploaderName(profile?.displayName || "");
        setBio(profile?.bio || "");

        // 取得上傳作品
        const novels = await getUserNovels(uid);
        setUploads(novels);

        // 取得收藏清單
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

  const tabs = [
    { id: "uploads", label: `上傳作品 (${uploads.length})` },
    { id: "favorites", label: `收藏 (${favorites.length})` },
  ];

  const displayName = uploaderName || "使用者";
  const initial = displayName.charAt(0).toUpperCase();

  if (notFound) {
    return (
      <div className="min-h-screen bg-light">
        <Navbar showBackButton={true} />
        <div className="max-w-7xl mx-auto px-4 py-24 text-center">
          <p className="text-gray-400 text-lg mb-4">找不到此使用者</p>
          <a href="/" className="text-primary hover:underline text-sm">回到首頁</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light">
      <Navbar showBackButton={true} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 使用者資訊 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-bold text-white">{initial}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-dark">{displayName}</h1>
            <p className="text-gray-500 text-sm mb-2">
              {uploads.length} 部作品・{favorites.length} 個收藏
            </p>
            {bio && (
              <p className="text-sm text-gray-600 break-words">{bio}</p>
            )}
          </div>
        </div>

        {/* Tab */}
        <div className="bg-white rounded-lg shadow-md p-2 mb-8">
          <div className="flex gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200
                  ${activeTab === tab.id
                    ? "bg-primary text-white shadow-md"
                    : "bg-transparent text-gray-600 hover:bg-light"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 內容 */}
        {loading ? (
          <p className="text-center text-gray-500 py-16">載入中...</p>
        ) : activeTab === "uploads" ? (
          uploads.length === 0 ? (
            <p className="text-center text-gray-500 py-16">此使用者尚未上傳任何作品</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {uploads.map((novel) => (
                <NovelCard key={novel.id} novel={novel} />
              ))}
            </div>
          )
        ) : (
          favorites.length === 0 ? (
            <p className="text-center text-gray-500 py-16">此使用者尚未收藏任何作品</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {favorites.map((novel) => (
                <NovelCard key={novel.id} novel={novel} />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
