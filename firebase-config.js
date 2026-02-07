// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Firebase Configuration (Apex CAD Solutions)
const firebaseConfig = {
  apiKey: "AIzaSyBy18nqqaq3nsaFkv3E7hmyJhQOv6gGg_g",
  authDomain: "apex-cad-solutions.firebaseapp.com",
  projectId: "apex-cad-solutions",
  storageBucket: "apex-cad-solutions.firebasestorage.app",
  messagingSenderId: "701417388296",
  appId: "1:701417388296:web:6173bd62d6cfa4014ad4bd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Optional debug (you can remove later)
console.log("🔥 Firebase connected successfully");
