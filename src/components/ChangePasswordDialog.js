// ============================================
// 檔案名稱: ChangePasswordDialog.js
// 路徑: src/components/ChangePasswordDialog.js
// 用途: 更改密碼對話框（舊密碼驗證 + 新密碼 + 確認新密碼）
// ============================================
import React, { useState } from "react";
import { changePassword } from "../firebase/auth";

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

    // 前端驗證
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
    <>
      {/* 遮罩層 */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={handleClose}
      />

      {/* 對話框 */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-fadeIn"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-xl font-bold text-dark mb-4">更改密碼</h3>

          {success ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                密碼已成功更改！
              </div>
              <button
                onClick={handleClose}
                className="w-full py-2.5 bg-primary text-white rounded-lg font-semibold
                         hover:bg-primary/90 transition-colors"
              >
                關閉
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 錯誤訊息 */}
              {error && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* 舊密碼 */}
              <div>
                <label className="block text-sm font-medium text-dark mb-2">
                  舊密碼
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="請輸入目前的密碼"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg
                           focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* 新密碼 */}
              <div>
                <label className="block text-sm font-medium text-dark mb-2">
                  新密碼
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="至少 6 位"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg
                           focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* 確認新密碼 */}
              <div>
                <label className="block text-sm font-medium text-dark mb-2">
                  確認新密碼
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="再次輸入新密碼"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg
                           focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* 按鈕區 */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1 py-2.5 bg-gray-200 text-dark rounded-lg font-semibold
                           hover:bg-gray-300 transition-colors disabled:opacity-60"
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
                  {loading ? "更改中..." : "確認更改"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </>
  );
}
