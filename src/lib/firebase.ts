import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD4xl6KDqcLxfB-SQAuQ7bcSYpg1aZErVc",
  authDomain: "annular-tracker-807pf.firebaseapp.com",
  projectId: "annular-tracker-807pf",
  storageBucket: "annular-tracker-807pf.firebasestorage.app",
  messagingSenderId: "28283667301",
  appId: "1:28283667301:web:307be4342c0f56a2c6178c"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Authenticate anonymously so request.auth != null is satisfied for Firestore security rules
onAuthStateChanged(auth, (user) => {
  if (!user) {
    signInAnonymously(auth).catch((err) => {
      console.warn("Anonymous sign-in note:", err);
    });
  }
});

export const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true
}, "ai-studio-15c245e1-a40d-4f95-a1bf-5e60ce4b4dc4");
