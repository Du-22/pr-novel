import React, { useState } from "react";
import Navbar from "../components/Navbar";
import MyFavorites from "../components/profile/MyFavorites";
import MyWorks from "../components/profile/MyWorks";
import ReadingHistory from "../components/profile/ReadingHistory";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("favorites");

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
        {/* 頁面標題 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-dark mb-2">個人中心</h1>
          <p className="text-gray-600">管理你的收藏、作品和閱讀記錄</p>
        </div>

        {/* Tab 切換按鈕 */}
        <div className="bg-white rounded-lg shadow-md p-2 mb-8">
          <div className="flex gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex-1 px-6 py-3 rounded-lg font-semibold transition-all duration-200
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
