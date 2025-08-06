// Safe Firestore functions that handle Firebase initialization errors

let db = null;
let isFirebaseInitialized = false;

const initializeFirestoreSafely = async () => {
  if (isFirebaseInitialized) {
    return db;
  }

  try {
    const { db: firebaseDb } = await import('./firebaseConfig.ts');
    db = firebaseDb;
    isFirebaseInitialized = true;
    return db;
  } catch (error) {
    console.error('Firestore initialization error:', error);
    return null;
  }
};

export const getUserData = async (uid) => {
  try {
    const dbInstance = await initializeFirestoreSafely();
    if (!dbInstance) {
      return {
        error: 'Firestore is not available',
        success: false
      };
    }

    const { doc, getDoc } = await import('firebase/firestore');
    const userDocRef = doc(dbInstance, 'users', uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      return {
        data: userDoc.data(),
        success: true
      };
    } else {
      return {
        error: 'User document does not exist',
        success: false
      };
    }
  } catch (error) {
    return {
      error: error.message || 'Failed to get user data',
      success: false
    };
  }
};

export const setUserData = async (uid, data) => {
  try {
    const dbInstance = await initializeFirestoreSafely();
    if (!dbInstance) {
      return {
        error: 'Firestore is not available',
        success: false
      };
    }

    const { doc, setDoc } = await import('firebase/firestore');
    const userDocRef = doc(dbInstance, 'users', uid);
    await setDoc(userDocRef, {
      ...data,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    
    return {
      success: true
    };
  } catch (error) {
    return {
      error: error.message || 'Failed to set user data',
      success: false
    };
  }
};

// Export db instance for use in other files if needed
export { db }; 