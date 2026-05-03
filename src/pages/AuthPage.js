// ============================================
// 檔案名稱: AuthPage.js
// 路徑: src/pages/AuthPage.js
// 用途: 登入 / 註冊頁 — 第一印象頁面,Email + Google 雙登入路徑,
//       含忘記密碼 dialog
// ============================================

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Info, CheckCircle2 } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../hooks/useAuth";
import {
  loginWithEmail,
  registerWithEmail,
  loginWithGoogle,
  resetPassword,
} from "../firebase/auth";

// 共用 input 樣式
const INPUT_CLASS =
  "w-full px-4 py-2.5 rounded-lg border " +
  "bg-white text-neutral-900 placeholder-neutral-400 border-neutral-300 " +
  "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 " +
  "dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500 dark:border-neutral-700";

const LABEL_CLASS =
  "block text-sm font-medium mb-2 text-neutral-900 dark:text-neutral-100";

const PRIMARY_BTN =
  "py-3 rounded-lg font-semibold transition-colors " +
  "bg-primary text-white hover:bg-primary-dark " +
  "disabled:bg-neutral-300 disabled:text-neutral-500 disabled:cursor-not-allowed " +
  "dark:disabled:bg-neutral-700 dark:disabled:text-neutral-500";

export default function AuthPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

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

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

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

  const switchTab = (tab) => {
    setActiveTab(tab);
    setError("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setDisplayName("");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
        <Navbar showBackButton={false} />
        <div className="flex items-center justify-center h-screen">
          <p className="text-neutral-500 dark:text-neutral-400">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950">
      <Navbar showBackButton={false} />

      <main className="flex-1 max-w-md w-full mx-auto px-4 py-12">
        {/* ========== 標題 ========== */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2
                         text-neutral-900 dark:text-neutral-100">
            歡迎來到 PR 小說網
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            登入或註冊開始閱讀
          </p>
        </div>

        {/* ========== 主卡片 ========== */}
        <div className="rounded-2xl border p-6
                        bg-white border-neutral-200
                        dark:bg-neutral-900 dark:border-neutral-800">
          {/* ---- Tab 切換 (segmented control) ---- */}
          <div className="flex gap-1 p-1 mb-6 rounded-lg
                          bg-neutral-100 dark:bg-neutral-800">
            <button
              onClick={() => switchTab("login")}
              className={`flex-1 py-2.5 rounded-md font-semibold text-sm transition-all ${
                activeTab === "login"
                  ? "bg-white text-primary shadow-sm dark:bg-neutral-700 dark:text-primary-light"
                  : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
              }`}
            >
              登入
            </button>
            <button
              onClick={() => switchTab("register")}
              className={`flex-1 py-2.5 rounded-md font-semibold text-sm transition-all ${
                activeTab === "register"
                  ? "bg-white text-primary shadow-sm dark:bg-neutral-700 dark:text-primary-light"
                  : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
              }`}
            >
              註冊
            </button>
          </div>

          {/* ---- 錯誤訊息 ---- */}
          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm
                            bg-danger-light text-danger
                            dark:bg-danger/15 dark:text-danger">
              {error}
            </div>
          )}

          {/* ---- 登入表單 ---- */}
          {activeTab === "login" && (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className={LABEL_CLASS}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label className={LABEL_CLASS}>密碼</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="至少 6 位"
                  required
                  className={INPUT_CLASS}
                />
              </div>

              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm transition-colors
                             text-primary hover:text-primary-dark
                             dark:text-primary-light dark:hover:text-primary"
                >
                  忘記密碼?
                </button>
              </div>

              <button type="submit" disabled={loading} className={`w-full ${PRIMARY_BTN}`}>
                {loading ? "登入中..." : "登入"}
              </button>
            </form>
          )}

          {/* ---- 註冊表單 ---- */}
          {activeTab === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className={LABEL_CLASS}>使用者名稱</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="你的暱稱"
                  required
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label className={LABEL_CLASS}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label className={LABEL_CLASS}>密碼</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="至少 6 位"
                  required
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label className={LABEL_CLASS}>確認密碼</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="再次輸入密碼"
                  required
                  className={INPUT_CLASS}
                />
              </div>

              <button type="submit" disabled={loading} className={`w-full ${PRIMARY_BTN}`}>
                {loading ? "註冊中..." : "註冊"}
              </button>
            </form>
          )}

          {/* ---- 分隔線 ---- */}
          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-neutral-200 dark:border-neutral-800"></div>
            <span className="px-4 text-sm text-neutral-500 dark:text-neutral-400">
              或
            </span>
            <div className="flex-1 border-t border-neutral-200 dark:border-neutral-800"></div>
          </div>

          {/* ---- Google 登入 ---- */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-3 border-2
                       bg-white border-neutral-300 text-neutral-900 hover:bg-neutral-50
                       dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-800
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            使用 Google 登入
          </button>
        </div>

        {/* ========== 使用說明 ========== */}
        <div className="mt-6 p-4 rounded-xl border flex items-start gap-3
                        bg-info-light/40 border-info/20
                        dark:bg-info/10 dark:border-info/30">
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5 text-info" />
          <p className="text-sm text-neutral-700 dark:text-neutral-300">
            註冊後即可使用收藏、書籤、閱讀記錄等功能,並可跨裝置同步
          </p>
        </div>
      </main>

      <Footer />

      {/* ========== 忘記密碼 dialog ========== */}
      {showForgotPassword && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => {
            setShowForgotPassword(false);
            setResetSuccess(false);
            setError("");
          }}
        >
          <div
            className="w-full max-w-md p-6 rounded-2xl shadow-2xl
                       bg-white dark:bg-neutral-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4 text-neutral-900 dark:text-neutral-100">
              重設密碼
            </h3>

            {resetSuccess ? (
              <div className="space-y-4">
                <div className="p-4 rounded-lg flex items-start gap-3
                                bg-success-light text-success
                                dark:bg-success/15">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">
                    密碼重設信件已發送!請檢查你的 Email 收件匣。
                  </span>
                </div>
                <button
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetSuccess(false);
                  }}
                  className={`w-full ${PRIMARY_BTN}`}
                >
                  關閉
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  請輸入你的 Email,我們會寄送密碼重設連結給你。
                </p>

                <div>
                  <label className={LABEL_CLASS}>Email</label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className={INPUT_CLASS}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setError("");
                      setResetEmail("");
                    }}
                    className="flex-1 py-2.5 rounded-lg font-semibold transition-colors
                               bg-neutral-100 text-neutral-700 hover:bg-neutral-200
                               dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
                  >
                    取消
                  </button>
                  <button type="submit" disabled={loading} className={`flex-1 ${PRIMARY_BTN}`}>
                    {loading ? "發送中..." : "發送"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
