// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyB_sm6Qx6yy3BwdD_7daw1aPSsFAAIK7XE",
  authDomain: "digitox-fbf32.firebaseapp.com",
  projectId: "digitox-fbf32",
  storageBucket: "digitox-fbf32.firebasestorage.app",
  messagingSenderId: "245053492044",
  appId: "1:245053492044:web:4680cdc2ef197a3ea19de9",
  measurementId: "G-CRQRGFCG1D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);

// Export the services
export { app, auth, db };
