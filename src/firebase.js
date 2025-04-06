import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDGpHoBeVP6YWPmPTnBhKffr4TJLc6AFKA",
  authDomain: "eatvisionai.firebaseapp.com",
  projectId: "eatvisionai",
  storageBucket: "eatvisionai.firebasestorage.app",
  messagingSenderId: "207078153906",
  appId: "1:207078153906:web:4b7824b3eb28982e83f3ab",
  measurementId: "G-89KKNC5YC2"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);