import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import { auth } from "./config";

// ========== 註冊新使用者 (Email/Password) ==========
/**
 * 使用 Email 和密碼註冊新使用者
 * @param {string} email - 使用者 Email
 * @param {string} password - 密碼 (至少 6 位)
 * @param {string} displayName - 使用者名稱 (選填)
 * @returns {Promise<UserCredential>}
 */
export const registerWithEmail = async (email, password, displayName = "") => {
  try {
    // 建立新使用者
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    // 如果有提供名稱,更新使用者資料
    if (displayName) {
      await updateProfile(userCredential.user, {
        displayName: displayName,
      });
    }

    console.log("✅ 註冊成功:", userCredential.user.email);
    return userCredential;
  } catch (error) {
    console.error("❌ 註冊失敗:", error.message);
    throw handleAuthError(error);
  }
};

// ========== 登入 (Email/Password) ==========
/**
 * 使用 Email 和密碼登入
 * @param {string} email - 使用者 Email
 * @param {string} password - 密碼
 * @returns {Promise<UserCredential>}
 */
export const loginWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    console.log("✅ 登入成功:", userCredential.user.email);
    return userCredential;
  } catch (error) {
    console.error("❌ 登入失敗:", error.message);
    throw handleAuthError(error);
  }
};

// ========== Google 登入 ==========
/**
 * 使用 Google 帳號登入
 * @returns {Promise<UserCredential>}
 */
export const loginWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    // 設定語言為繁體中文
    auth.languageCode = "zh-TW";

    const userCredential = await signInWithPopup(auth, provider);
    console.log("✅ Google 登入成功:", userCredential.user.email);
    return userCredential;
  } catch (error) {
    console.error("❌ Google 登入失敗:", error.message);
    throw handleAuthError(error);
  }
};

// ========== 登出 ==========
/**
 * 登出目前使用者
 * @returns {Promise<void>}
 */
export const logout = async () => {
  try {
    await signOut(auth);
    console.log("✅ 登出成功");
  } catch (error) {
    console.error("❌ 登出失敗:", error.message);
    throw handleAuthError(error);
  }
};

// ========== 重設密碼 ==========
/**
 * 發送密碼重設信件
 * @param {string} email - 使用者 Email
 * @returns {Promise<void>}
 */
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    console.log("✅ 密碼重設信件已發送至:", email);
  } catch (error) {
    console.error("❌ 發送密碼重設信件失敗:", error.message);
    throw handleAuthError(error);
  }
};

// ========== 取得目前使用者 ==========
/**
 * 取得目前登入的使用者
 * @returns {User | null}
 */
export const getCurrentUser = () => {
  return auth.currentUser;
};

// ========== 錯誤處理 ==========
/**
 * 將 Firebase Auth 錯誤轉換為使用者友善的訊息
 * @param {FirebaseError} error
 * @returns {Error}
 */
const handleAuthError = (error) => {
  let message = "發生未知錯誤,請稍後再試";

  switch (error.code) {
    // 註冊相關錯誤
    case "auth/email-already-in-use":
      message = "此 Email 已被註冊";
      break;
    case "auth/invalid-email":
      message = "Email 格式不正確";
      break;
    case "auth/weak-password":
      message = "密碼強度不足 (至少需要 6 位)";
      break;

    // 登入相關錯誤
    case "auth/user-not-found":
      message = "找不到此使用者";
      break;
    case "auth/wrong-password":
      message = "密碼錯誤";
      break;
    case "auth/user-disabled":
      message = "此帳號已被停用";
      break;
    case "auth/invalid-credential":
      message = "帳號或密碼錯誤";
      break;

    // Google 登入相關錯誤
    case "auth/popup-closed-by-user":
      message = "登入視窗已關閉";
      break;
    case "auth/cancelled-popup-request":
      message = "登入請求已取消";
      break;
    case "auth/popup-blocked":
      message = "彈出視窗被封鎖,請允許彈出視窗";
      break;

    // 網路相關錯誤
    case "auth/network-request-failed":
      message = "網路連線失敗,請檢查網路";
      break;

    // 其他錯誤
    case "auth/too-many-requests":
      message = "嘗試次數過多,請稍後再試";
      break;

    default:
      message = error.message || "發生錯誤,請稍後再試";
  }

  return new Error(message);
};

export { auth };
