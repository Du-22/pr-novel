// ============================================
// 檔案名稱: ChangePasswordDialog.js
// 路徑: src/components/ChangePasswordDialog.js
// 用途: 更改密碼對話框(舊密碼驗證 + 新密碼 + 確認新密碼)
// ============================================

import React, { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { changePassword } from "../firebase/auth";

// 共用 input / label / 主按鈕 className
const INPUT_CLASS =
  "w-full px-4 py-2.5 rounded-lg border " +
  "bg-white text-neutral-900 placeholder-neutral-400 border-neutral-300 " +
  "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 " +
  "dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500 dark:border-neutral-700";

const LABEL_CLASS =
  "block text-sm font-medium mb-2 text-neutral-900 dark:text-neutral-100";

const PRIMARY_BTN =
  "py-2.5 rounded-lg font-semibold transition-colors " +
  "bg-primary text-white hover:bg-primary-dark " +
  "disabled:bg-neutral-300 disabled:text-neutral-500 disabled:cursor-not-allowed " +
  "dark:disabled:bg-neutral-700 dark:disabled:text-neutral-500";

export default function ChangePasswordDialog({ isOpen, onClose }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setSuccess(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("請填寫所有欄位");
      return;
    }
    if (newPassword.length < 6) {
      setError("新密碼至少需要 6 位");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("新密碼與確認密碼不一致");
      return;
    }
    if (newPassword === currentPassword) {
      setError("新密碼不可與舊密碼相同");
      return;
    }

    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md p-6 rounded-2xl shadow-2xl
                   bg-white dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold mb-4 text-neutral-900 dark:text-neutral-100">
          更改密碼
        </h3>

        {success ? (
          <div className="space-y-4">
            <div className="p-4 rounded-lg flex items-start gap-3
                            bg-success-light text-success
                            dark:bg-success/15">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span className="text-sm">密碼已成功更改</span>
            </div>
            <button onClick={handleClose} className={`w-full ${PRIMARY_BTN}`}>
              關閉
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg text-sm
                              bg-danger-light text-danger
                              dark:bg-danger/15">
                {error}
              </div>
            )}

            <div>
              <label className={LABEL_CLASS}>舊密碼</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="請輸入目前的密碼"
                required
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>新密碼</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="至少 6 位"
                required
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>確認新密碼</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="再次輸入新密碼"
                required
                className={INPUT_CLASS}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 py-2.5 rounded-lg font-semibold transition-colors
                           bg-neutral-100 text-neutral-700 hover:bg-neutral-200
                           dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700
                           disabled:opacity-60"
              >
                取消
              </button>
              <button type="submit" disabled={loading} className={`flex-1 ${PRIMARY_BTN}`}>
                {loading ? "更改中..." : "確認更改"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
