// src/firebase.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDGpHoBeVP6YWPmPTnBhKffr4TJLc6AFKA",
  authDomain: "eatvisionai.firebaseapp.com",
  projectId: "eatvisionai",
  storageBucket: "eatvisionai.appspot.com",
  messagingSenderId: "207078153906",
  appId: "1:207078153906:web:your-app-id" // замените на реальный appId из настроек
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
