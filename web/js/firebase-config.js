// Firebase Configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-storage.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCqIlpYO725f2tfXHz3BB06oHO8IcnMO_c",
  authDomain: "laesquinarestaurante.firebaseapp.com",
  projectId: "laesquinarestaurante",
  storageBucket: "laesquinarestaurante.firebasestorage.app",
  messagingSenderId: "335066879706",
  appId: "1:335066879706:web:e74dcd1edd0ff8064837e3",
  measurementId: "G-K77YDKRNV3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const realtimeDb = getDatabase(app);
