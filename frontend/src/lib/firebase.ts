import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCH7UVd4OQbJjQO7-Hu9v0QWAdyNyVxXmo",
  authDomain: "nexy-smarthome.firebaseapp.com",
  projectId: "nexy-smarthome",
  storageBucket: "nexy-smarthome.firebasestorage.app",
  messagingSenderId: "787598351018",
  appId: "1:787598351018:web:fa19f8ae9f4f799aaa0ed3",
  measurementId: "G-TQCCE7TF41",
};

// Prevent duplicate app initialization (Next.js hot-reload safe)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);
