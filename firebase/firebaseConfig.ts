// firebase/firebaseConfig.ts - Secure version with environment variables
import { initializeApp, getApps } from "firebase/app";
import { initializeAuth, getReactNativePersistence, getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { Platform } from 'react-native';

// Environment variable helper with development fallbacks
const getEnvVar = (key: string, fallback?: string): string => {
  const value = process.env[key];
  if (!value) {
    if (__DEV__ && fallback) {
      console.warn(`Using fallback for ${key} in development mode`);
      return fallback;
    }
    throw new Error(`🚨 PRODUCTION ERROR: Required environment variable ${key} is not set. Please configure your environment variables.`);
  }
  return value;
};

// Firebase configuration with development fallbacks
// In production, these MUST be set as environment variables (Expo EAS, app stores, etc.)
export const firebaseConfig = {
  apiKey: getEnvVar('EXPO_PUBLIC_FIREBASE_API_KEY', 'AIzaSyB_sm6Qx6yy3BwdD_7daw1aPSsFAAIK7XE'),
  authDomain: getEnvVar('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN', 'detoxly-fbf32.firebaseapp.com'),
  projectId: getEnvVar('EXPO_PUBLIC_FIREBASE_PROJECT_ID', 'detoxly-fbf32'),
  storageBucket: getEnvVar('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET', 'detoxly-fbf32.firebasestorage.app'),
  messagingSenderId: getEnvVar('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', '245053492044'),
  appId: getEnvVar('EXPO_PUBLIC_FIREBASE_APP_ID', '1:245053492044:web:4680cdc2ef197a3ea19de9'),
  measurementId: getEnvVar('EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID', 'G-CRQRGFCG1D')
};

// Debug logging (only in development)
if (__DEV__) {
  console.log('Firebase Config Debug:');
  console.log('Platform:', Platform.OS);
  console.log('🔑 Using environment variables for Firebase config');
}

console.log('Existing apps:', getApps().length);

// Initialize Firebase
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
      console.log('Firebase app initialized');
} else {
  app = getApps()[0];
      console.log('Using existing Firebase app');
}

// Initialize Firebase Auth with platform-aware persistence
let auth;
try {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
          console.log('Initializing auth for mobile platform');
    // Try to import AsyncStorage
    let AsyncStorage;
    try {
      AsyncStorage = require('@react-native-async-storage/async-storage').default;
      console.log('AsyncStorage imported successfully');
      
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
      });
      console.log('Auth initialized with AsyncStorage persistence');
    } catch (asyncStorageError) {
      console.warn('AsyncStorage import failed:', asyncStorageError.message);
      console.log('🔄 Falling back to default auth');
      auth = getAuth(app);
    }
  } else {
    console.log('🌐 Initializing auth for web platform');
    auth = getAuth(app);
  }
} catch (authError) {
        console.error('Auth initialization error:', authError.message);
  console.log('🔄 Attempting fallback auth initialization');
  try {
    auth = getAuth(app);
          console.log('Fallback auth successful');
  } catch (fallbackError) {
    console.error('💥 Complete auth failure:', fallbackError.message);
    throw fallbackError;
  }
}

// Initialize Firestore
const db = getFirestore(app);
  console.log('Firestore initialized');

// Export the services
export { app, auth, db };