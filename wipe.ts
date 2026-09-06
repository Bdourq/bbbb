import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "annular-tracker-807pf",
  appId: "1:28283667301:web:307be4342c0f56a2c6178c",
  apiKey: "AIzaSyD4xl6KDqcLxfB-SQAuQ7bcSYpg1aZErVc",
  authDomain: "annular-tracker-807pf.firebaseapp.com",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-15c245e1-a40d-4f95-a1bf-5e60ce4b4dc4");

async function wipe() {
  const querySnapshot = await getDocs(collection(db, "shifts"));
  for (const document of querySnapshot.docs) {
    await deleteDoc(doc(db, "shifts", document.id));
    console.log(`Deleted ${document.id}`);
  }
  console.log("All shifts deleted");
}

wipe();
