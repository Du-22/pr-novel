// ============================================
// 檔案名稱: ProfilePage.js
// 路徑: src/pages/ProfilePage.js
// 用途: 個人中心 — 收藏 / 作品 / 閱讀記錄 Tab + 簡介編輯 + 更改密碼
// ============================================

import React, { useState, useEffect } from "react";
import { useParams, Navigate, useNavigate } from "react-router-dom";
import { Heart, BookMarked, History } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import MyFavorites from "../components/profile/MyFavorites";
import MyWorks from "../components/profile/MyWorks";
import ReadingHistory from "../components/profile/ReadingHistory";
import ChangePasswordDialog from "../components/ChangePasswordDialog";
import { useAuth } from "../hooks/useAuth";
import { getUserProfile, updateUserProfile } from "../firebase/users";
import { updateDisplayName } from "../firebase/auth";

const TABS = [
  { id: "favorites", label: "我的收藏", Icon: Heart },
  { id: "works", label: "我的作品", Icon: BookMarked },
  { id: "history", label: "閱讀記錄", Icon: History },
];

const VALID_TABS = TABS.map((t) => t.id);

export default function ProfilePage() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [bio, setBio] = useState("");
  const [editingBio, setEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState("");
  const [savingBio, setSavingBio] = useState(false);

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);

  const [showChangePassword, setShowChangePassword] = useState(false);

  const isEmailUser = user?.providerData?.some(
    (p) => p.providerId === "password"
  );

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

  const handleSaveName = async () => {
    if (!user || !nameInput.trim()) return;
    setSavingName(true);
    try {
      await updateDisplayName(nameInput.trim());
      await updateUserProfile(user.uid, { displayName: nameInput.trim() });
      setEditingName(false);
    } catch {
      alert("儲存失敗,請稍後再試");
    } finally {
      setSavingName(false);
    }
  };

  const handleSaveBio = async () => {
    if (!user) return;
    setSavingBio(true);
    try {
      await updateUserProfile(user.uid, { bio: bioInput.trim() });
      setBio(bioInput.trim());
      setEditingBio(false);
    } catch {
      alert("儲存失敗,請稍後再試");
    } finally {
      setSavingBio(false);
    }
  };

  const displayName = user?.displayName || user?.email?.split("@")[0] || "使用者";
  const initial = displayName.charAt(0).toUpperCase();

  // tab 切換改成 URL 操作(各 tab 有自己路徑);
  // 不認得的 tab 名稱導回預設
  if (tab && !VALID_TABS.includes(tab)) {
    return <Navigate to="/profile/favorites" replace />;
  }
  const activeTab = tab;
  const setActiveTab = (id) => navigate(`/profile/${id}`);

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
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950">
      <Navbar showBackButton={false} />

      <main className="flex-1 container mx-auto px-4 py-8 md:py-12 max-w-6xl space-y-6 md:space-y-8">
        {/* ========== 使用者資訊卡 ========== */}
        {user && (
          <div className="rounded-2xl border p-5 sm:p-6
                          bg-white border-neutral-200
                          dark:bg-neutral-900 dark:border-neutral-800">
            <div className="flex items-start gap-4">
              {/* 頭像 */}
              <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0
                              bg-primary dark:bg-primary-dark">
                <span className="text-2xl font-bold text-white">{initial}</span>
              </div>

              {/* 名稱 + 簡介 */}
              <div className="flex-1 min-w-0">
                {editingName ? (
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      maxLength={20}
                      className="px-2 py-1 text-sm font-bold rounded-lg border w-40
                                 bg-white text-neutral-900 border-neutral-300
                                 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
                                 dark:bg-neutral-800 dark:text-neutral-100 dark:border-neutral-700"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveName();
                        if (e.key === "Escape") setEditingName(false);
                      }}
                      autoFocus
                    />
                    <button
                      onClick={handleSaveName}
                      disabled={savingName}
                      className="text-xs font-medium transition-colors
                                 text-primary hover:text-primary-dark
                                 dark:text-primary-light dark:hover:text-primary"
                    >
                      {savingName ? "儲存中..." : "確認"}
                    </button>
                    <button
                      onClick={() => setEditingName(false)}
                      className="text-xs transition-colors
                                 text-neutral-400 hover:text-neutral-700
                                 dark:text-neutral-500 dark:hover:text-neutral-300"
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <h1
                    onClick={() => {
                      setNameInput(displayName);
                      setEditingName(true);
                    }}
                    className="inline-block text-xl font-bold mb-1 px-2 py-0.5 -mx-2 rounded cursor-pointer transition-colors
                               text-neutral-900 hover:bg-neutral-100
                               dark:text-neutral-100 dark:hover:bg-neutral-800"
                    title="點擊修改暱稱"
                  >
                    {displayName}
                  </h1>
                )}
                <p className="text-sm mb-3 text-neutral-400 dark:text-neutral-500">
                  {user.email}
                </p>

                {editingBio ? (
                  <div className="space-y-2">
                    <textarea
                      value={bioInput}
                      onChange={(e) => setBioInput(e.target.value)}
                      placeholder="介紹一下自己吧..."
                      maxLength={200}
                      rows={3}
                      className="w-full px-3 py-2 text-sm rounded-lg border resize-none
                                 bg-white text-neutral-900 placeholder-neutral-400 border-neutral-300
                                 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
                                 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500 dark:border-neutral-700"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-neutral-400 dark:text-neutral-500">
                        {bioInput.length}/200
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setBioInput(bio);
                            setEditingBio(false);
                          }}
                          className="px-3 py-1.5 text-sm transition-colors
                                     text-neutral-600 hover:text-neutral-900
                                     dark:text-neutral-400 dark:hover:text-neutral-100"
                        >
                          取消
                        </button>
                        <button
                          onClick={handleSaveBio}
                          disabled={savingBio}
                          className="px-4 py-1.5 text-sm rounded-lg font-medium transition-colors
                                     bg-primary text-white hover:bg-primary-dark
                                     disabled:opacity-60"
                        >
                          {savingBio ? "儲存中..." : "儲存"}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p
                    onClick={() => setEditingBio(true)}
                    className="text-sm break-words cursor-pointer px-2 py-1 -mx-2 -my-1 rounded transition-colors
                               text-neutral-700 hover:bg-neutral-100
                               dark:text-neutral-300 dark:hover:bg-neutral-800"
                    title="點擊編輯自我介紹"
                  >
                    {bio || (
                      <span className="italic text-neutral-400 dark:text-neutral-500">
                        未填寫自我介紹
                      </span>
                    )}
                  </p>
                )}
              </div>

              {/* 右上角操作按鈕 (僅 Email 使用者) */}
              {isEmailUser && (
                <button
                  onClick={() => setShowChangePassword(true)}
                  className="flex-shrink-0 px-3 py-1.5 text-sm rounded-lg border whitespace-nowrap transition-colors
                             text-neutral-700 border-neutral-300 hover:border-primary hover:text-primary
                             dark:text-neutral-300 dark:border-neutral-700 dark:hover:border-primary-light dark:hover:text-primary-light"
                >
                  更改密碼
                </button>
              )}
            </div>
          </div>
        )}

        {/* ========== Tab 切換 (segmented control) ========== */}
        <div className="rounded-xl p-1.5
                        bg-neutral-100 dark:bg-neutral-800">
          <div className="flex gap-1">
            {TABS.map((tab) => {
              const Icon = tab.Icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 inline-flex items-center justify-center gap-2 px-3 sm:px-6 py-2.5 rounded-lg font-semibold text-sm sm:text-base transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-white text-primary shadow-sm dark:bg-neutral-700 dark:text-primary-light"
                      : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ========== 內容區 ========== */}
        <div>{renderContent()}</div>
      </main>

      <Footer />

      {/* ========== 更改密碼對話框 ========== */}
      <ChangePasswordDialog
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />
    </div>
  );
}
