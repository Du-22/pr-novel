// ============================================
// 檔案名稱: ProfilePage.js
// 路徑: src/pages/ProfilePage.js
// 用途: 個人中心（收藏/作品/閱讀記錄 Tab + 簡介編輯）
// ============================================
import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import MyFavorites from "../components/profile/MyFavorites";
import MyWorks from "../components/profile/MyWorks";
import ReadingHistory from "../components/profile/ReadingHistory";
import { useAuth } from "../hooks/useAuth";
import { getUserProfile, updateUserProfile } from "../firebase/users";

export default function ProfilePage() {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "favorites";
  const [activeTab, setActiveTab] = useState(initialTab);
  const { user } = useAuth();

  const [bio, setBio] = useState("");
  const [editingBio, setEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState("");
  const [savingBio, setSavingBio] = useState(false);

  // 載入使用者簡介
  useEffect(() => {
    if (!user) return;
    getUserProfile(user.uid).then((profile) => {
      if (profile?.bio) {
        setBio(profile.bio);
        setBioInput(profile.bio);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSaveBio = async () => {
    if (!user) return;
    setSavingBio(true);
    try {
      await updateUserProfile(user.uid, { bio: bioInput.trim() });
      setBio(bioInput.trim());
      setEditingBio(false);
    } catch {
      alert("儲存失敗，請稍後再試");
    } finally {
      setSavingBio(false);
    }
  };

  const displayName = user?.displayName || user?.email?.split("@")[0] || "使用者";
  const initial = displayName.charAt(0).toUpperCase();

  // Tab 配置
  const tabs = [
    { id: "favorites", label: "我的收藏", icon: "💜" },
    { id: "works", label: "我的作品", icon: "📝" },
    { id: "history", label: "閱讀記錄", icon: "📖" },
  ];

  // 渲染內容
  const renderContent = () => {
    switch (activeTab) {
      case "favorites":
        return <MyFavorites />;
      case "works":
        return <MyWorks />;
      case "history":
        return <ReadingHistory />;
      default:
        return <MyFavorites />;
    }
  };

  return (
    <div className="min-h-screen bg-light">
      <Navbar showBackButton={false} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 使用者資訊卡 */}
        {user && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-start gap-4">
              {/* 頭像 */}
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-bold text-white">{initial}</span>
              </div>

              {/* 名稱 + 簡介 */}
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-dark mb-1">{displayName}</h1>
                <p className="text-sm text-gray-400 mb-3">{user.email}</p>

                {editingBio ? (
                  <div className="space-y-2">
                    <textarea
                      value={bioInput}
                      onChange={(e) => setBioInput(e.target.value)}
                      placeholder="介紹一下自己吧..."
                      maxLength={200}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                               focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">{bioInput.length}/200</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setBioInput(bio); setEditingBio(false); }}
                          className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                        >
                          取消
                        </button>
                        <button
                          onClick={handleSaveBio}
                          disabled={savingBio}
                          className="px-4 py-1.5 text-sm bg-primary text-white rounded-lg
                                   hover:bg-primary/90 transition-colors disabled:opacity-60"
                        >
                          {savingBio ? "儲存中..." : "儲存"}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p
                    onClick={() => setEditingBio(true)}
                    className="text-sm break-words cursor-pointer hover:bg-light rounded px-2 py-1 -mx-2 -my-1 transition-colors"
                    title="點擊編輯自我介紹"
                  >
                    {bio || <span className="text-gray-400 italic">未填寫自我介紹</span>}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 切換按鈕 */}
        <div className="bg-white rounded-lg shadow-md p-2 mb-8">
          <div className="flex gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex-1 px-2 sm:px-6 py-3 rounded-lg font-semibold text-sm sm:text-base transition-all duration-200 whitespace-nowrap
                  ${
                    activeTab === tab.id
                      ? "bg-primary text-white shadow-md"
                      : "bg-transparent text-gray-600 hover:bg-light"
                  }
                `}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 內容區 */}
        <div className="transition-all duration-300">{renderContent()}</div>
      </div>
    </div>
  );
}
