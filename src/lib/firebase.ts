import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Your verified Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC8x6rpLOhHMOCN_i7k9t2cKF2yo7qqaSk",
  authDomain: "hotel-diamondfort.firebaseapp.com",
  projectId: "hotel-diamondfort",
  storageBucket: "hotel-diamondfort.firebasestorage.app",
  messagingSenderId: "37605835280",
  appId: "1:37605835280:web:cde8224b75ee8296428095",
  measurementId: "G-FZ98ZYQV0S"
};

/**
 * INITIALIZATION LOGIC
 * In Next.js, the code runs on both the server and the client.
 * This check prevents the "Firebase App named '[DEFAULT]' already exists" error
 * during development hot-reloads.
 */
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// --- SERVICES ---

// 1. Database: For staff profiles, attendance logs, and face signatures
export const db = getFirestore(app);

// 2. Storage: For saving actual JPEG images of staff face scans
export const storage = getStorage(app);

// 3. Auth: For securing the HR Dashboard (Email/Password Login)
export const auth = getAuth(app);

export default app;