// Safe authentication functions that handle Firebase initialization errors

let auth = null;
let isFirebaseInitialized = false;

const initializeFirebaseSafely = async () => {
  if (isFirebaseInitialized) {
    return auth;
  }

  try {
    const { auth: firebaseAuth } = await import('./firebaseConfig');
    auth = firebaseAuth;
    isFirebaseInitialized = true;
    return auth;
  } catch (error) {
    console.error('Firebase initialization error:', error);
    return null;
  }
};

export const registerUser = async (email, password) => {
  try {
    const authInstance = await initializeFirebaseSafely();
    if (!authInstance) {
      return {
        error: 'Firebase authentication is not available',
        success: false
      };
    }

    const { createUserWithEmailAndPassword } = await import('firebase/auth');
    const userCredential = await createUserWithEmailAndPassword(authInstance, email, password);
    return {
      user: userCredential.user,
      success: true
    };
  } catch (error) {
    return {
      error: error.message || 'Registration failed',
      success: false
    };
  }
};

export const loginUser = async (email, password) => {
  try {
    const authInstance = await initializeFirebaseSafely();
    if (!authInstance) {
      return {
        error: 'Firebase authentication is not available',
        success: false
      };
    }

    const { signInWithEmailAndPassword } = await import('firebase/auth');
    const userCredential = await signInWithEmailAndPassword(authInstance, email, password);
    return {
      user: userCredential.user,
      success: true
    };
  } catch (error) {
    return {
      error: error.message || 'Login failed',
      success: false
    };
  }
};

export const logoutUser = async () => {
  try {
    const authInstance = await initializeFirebaseSafely();
    if (!authInstance) {
      return {
        error: 'Firebase authentication is not available',
        success: false
      };
    }

    const { signOut } = await import('firebase/auth');
    await signOut(authInstance);
    return {
      success: true
    };
  } catch (error) {
    return {
      error: error.message || 'Logout failed',
      success: false
    };
  }
};

// Export auth instance for use in other files if needed
export { auth }; 