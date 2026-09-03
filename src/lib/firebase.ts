import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD4xl6KDqcLxfB-SQAuQ7bcSYpg1aZErVc",
  authDomain: "annular-tracker-807pf.firebaseapp.com",
  projectId: "annular-tracker-807pf",
  storageBucket: "annular-tracker-807pf.firebasestorage.app",
  messagingSenderId: "28283667301",
  appId: "1:28283667301:web:307be4342c0f56a2c6178c"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "ai-studio-15c245e1-a40d-4f95-a1bf-5e60ce4b4dc4");
