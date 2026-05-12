// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC8x6rpLOhHMOCN_i7k9t2cKF2yo7qqaSk",
  authDomain: "hotel-diamondfort.firebaseapp.com",
  projectId: "hotel-diamondfort",
  storageBucket: "hotel-diamondfort.firebasestorage.app",
  messagingSenderId: "37605835280",
  appId: "1:37605835280:web:cde8224b75ee8296428095",
  measurementId: "G-FZ98ZYQV0S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);