import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAeM011F5s4TvdrXePbUbpl_G2Yi9sl_qU",
  authDomain: "pr-novel.firebaseapp.com",
  projectId: "pr-novel",
  storageBucket: "pr-novel.firebasestorage.app",
  messagingSenderId: "733219607274",
  appId: "1:733219607274:web:324f51218552ba7ec3bd93",
  measurementId: "G-3LW1CYHYNF",
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 匯出服務
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
