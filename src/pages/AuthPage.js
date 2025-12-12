import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../hooks/useAuth";
import {
  loginWithEmail,
  registerWithEmail,
  loginWithGoogle,
  resetPassword,
} from "../firebase/auth";

export default function AuthPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  // Tab 狀態 ('login' 或 'register')
  const [activeTab, setActiveTab] = useState("login");

  // 表單狀態
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  // UI 狀態
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 忘記密碼狀態
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);

  // 如果已登入,跳轉到首頁
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  // ========== 處理 Email 登入 ==========
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await loginWithEmail(email, password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ========== 處理註冊 ==========
  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    // 驗證
    if (password !== confirmPassword) {
      setError("密碼與確認密碼不一致");
      return;
    }

    if (password.length < 6) {
      setError("密碼至少需要 6 位");
      return;
    }

    if (!displayName.trim()) {
      setError("請輸入使用者名稱");
      return;
    }

    setLoading(true);

    try {
      await registerWithEmail(email, password, displayName.trim());
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ========== 處理 Google 登入 ==========
  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      await loginWithGoogle();
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ========== 處理忘記密碼 ==========
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError("");
    setResetSuccess(false);

    if (!resetEmail.trim()) {
      setError("請輸入 Email");
      return;
    }

    setLoading(true);

    try {
      await resetPassword(resetEmail);
      setResetSuccess(true);
      setResetEmail("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ========== 切換 Tab ==========
  const switchTab = (tab) => {
    setActiveTab(tab);
    setError("");
    // 清空表單
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setDisplayName("");
  };

  // 載入中
  if (authLoading) {
    return (
      <div className="min-h-screen bg-light">
        <Navbar showBackButton={false} />
        <div className="flex items-center justify-center h-screen">
          <p className="text-gray-500">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light">
      <Navbar showBackButton={false} />

      <div className="max-w-md mx-auto px-4 py-12">
        {/* 標題 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-dark mb-2">
            歡迎來到 PR 小說網
          </h1>
          <p className="text-gray-600">登入或註冊開始閱讀</p>
        </div>

        {/* 主卡片 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Tab 切換按鈕 */}
          <div className="flex gap-2 mb-6 bg-light rounded-lg p-1">
            <button
              onClick={() => switchTab("login")}
              className={`
                flex-1 py-2.5 rounded-md font-semibold transition-all duration-200
                ${
                  activeTab === "login"
                    ? "bg-primary text-white shadow-md"
                    : "text-gray-600 hover:bg-white"
                }
              `}
            >
              登入
            </button>
            <button
              onClick={() => switchTab("register")}
              className={`
                flex-1 py-2.5 rounded-md font-semibold transition-all duration-200
                ${
                  activeTab === "register"
                    ? "bg-primary text-white shadow-md"
                    : "text-gray-600 hover:bg-white"
                }
              `}
            >
              註冊
            </button>
          </div>

          {/* 錯誤訊息 */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* 登入表單 */}
          {activeTab === "login" && (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-dark mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg 
                           focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* 密碼 */}
              <div>
                <label className="block text-sm font-medium text-dark mb-2">
                  密碼
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="至少 6 位"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg 
                           focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* 忘記密碼連結 */}
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  忘記密碼?
                </button>
              </div>

              {/* 登入按鈕 */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary text-white rounded-lg font-semibold
                         hover:bg-primary/90 transition-colors
                         disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading ? "登入中..." : "登入"}
              </button>
            </form>
          )}

          {/* 註冊表單 */}
          {activeTab === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              {/* 使用者名稱 */}
              <div>
                <label className="block text-sm font-medium text-dark mb-2">
                  使用者名稱
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="你的暱稱"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg 
                           focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-dark mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg 
                           focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* 密碼 */}
              <div>
                <label className="block text-sm font-medium text-dark mb-2">
                  密碼
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="至少 6 位"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg 
                           focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* 確認密碼 */}
              <div>
                <label className="block text-sm font-medium text-dark mb-2">
                  確認密碼
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="再次輸入密碼"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg 
                           focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* 註冊按鈕 */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary text-white rounded-lg font-semibold
                         hover:bg-primary/90 transition-colors
                         disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading ? "註冊中..." : "註冊"}
              </button>
            </form>
          )}

          {/* 分隔線 */}
          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-4 text-sm text-gray-500">或</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* Google 登入按鈕 */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3 bg-white border-2 border-gray-300 rounded-lg font-semibold
                     hover:bg-gray-50 transition-colors flex items-center justify-center gap-3
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            使用 Google 登入
          </button>
        </div>

        {/* 使用說明 */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 註冊後即可使用收藏、書籤、閱讀記錄等功能,並可跨裝置同步!
          </p>
        </div>
      </div>

      {/* 忘記密碼對話框 */}
      {showForgotPassword && (
        <>
          {/* 遮罩層 */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => {
              setShowForgotPassword(false);
              setResetSuccess(false);
              setError("");
            }}
          />

          {/* 對話框 */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 標題 */}
              <h3 className="text-xl font-bold text-dark mb-4">重設密碼</h3>

              {/* 成功訊息 */}
              {resetSuccess ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                    ✅ 密碼重設信件已發送!請檢查你的 Email 收件匣。
                  </div>
                  <button
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetSuccess(false);
                    }}
                    className="w-full py-2.5 bg-primary text-white rounded-lg font-semibold
                             hover:bg-primary/90 transition-colors"
                  >
                    關閉
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  {/* 說明 */}
                  <p className="text-sm text-gray-600">
                    請輸入你的 Email,我們會寄送密碼重設連結給你。
                  </p>

                  {/* Email 輸入 */}
                  <div>
                    <label className="block text-sm font-medium text-dark mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg 
                               focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  {/* 按鈕區 */}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setError("");
                        setResetEmail("");
                      }}
                      className="flex-1 py-2.5 bg-gray-200 text-dark rounded-lg font-semibold
                               hover:bg-gray-300 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-2.5 bg-primary text-white rounded-lg font-semibold
                               hover:bg-primary/90 transition-colors
                               disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {loading ? "發送中..." : "發送"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
