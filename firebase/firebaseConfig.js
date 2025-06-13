// firebase/firebaseConfig.js - Fixed version
// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { initializeAuth, getReactNativePersistence, getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { Platform } from 'react-native';

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

// Debug logging
console.log('🔧 Firebase Config Debug:');
console.log('Platform.OS:', Platform.OS);
console.log('Existing apps:', getApps().length);

// Initialize Firebase
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase app initialized');
} else {
  app = getApps()[0];
  console.log('♻️ Using existing Firebase app');
}

// Initialize Firebase Auth with platform-aware persistence
let auth;
try {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    console.log('📱 Initializing auth for mobile platform');
    // Try to import AsyncStorage
    let AsyncStorage;
    try {
      AsyncStorage = require('@react-native-async-storage/async-storage').default;
      console.log('✅ AsyncStorage imported successfully');
      
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
      });
      console.log('✅ Auth initialized with AsyncStorage persistence');
    } catch (asyncStorageError) {
      console.warn('⚠️ AsyncStorage import failed:', asyncStorageError.message);
      console.log('🔄 Falling back to default auth');
      auth = getAuth(app);
    }
  } else {
    console.log('🌐 Initializing auth for web platform');
    auth = getAuth(app);
  }
} catch (authError) {
  console.error('❌ Auth initialization error:', authError.message);
  console.log('🔄 Attempting fallback auth initialization');
  try {
    auth = getAuth(app);
    console.log('✅ Fallback auth successful');
  } catch (fallbackError) {
    console.error('💥 Complete auth failure:', fallbackError.message);
    throw fallbackError;
  }
}

// Initialize Firestore
const db = getFirestore(app);
console.log('✅ Firestore initialized');

// Export the services
export { app, auth, db };
