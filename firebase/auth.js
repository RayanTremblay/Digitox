import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from './firebaseConfig';

export const registerUser = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return {
      user: userCredential.user,
      success: true
    };
  } catch (error) {
    return {
      error: error.message,
      success: false
    };
  }
};

export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return {
      user: userCredential.user,
      success: true
    };
  } catch (error) {
    return {
      error: error.message,
      success: false
    };
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
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

export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return {
      success: true,
      message: 'Password reset email sent successfully'
    };
  } catch (error) {
    return {
      error: error.message,
      success: false
    };
  }
};

// Export auth instance for use in other files if needed
export { auth }; 