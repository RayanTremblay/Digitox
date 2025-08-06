import { 
  doc, 
  getDoc, 
  setDoc
} from 'firebase/firestore';
import { db } from './firebaseConfig.ts';

export const getUserData = async (uid) => {
  try {
    const userDocRef = doc(db, 'users', uid);
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
      error: error.message,
      success: false
    };
  }
};

export const setUserData = async (uid, data) => {
  try {
    const userDocRef = doc(db, 'users', uid);
    await setDoc(userDocRef, {
      ...data,
      updatedAt: new Date().toISOString()
    }, { merge: true }); // Using merge: true to update fields without overwriting the entire document
    
    return {
      success: true
    };
  } catch (error) {
    return {
      error: error.message,
      success: false
    };
  }
};

// Export db instance for use in other files if needed
export { db }; 