import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../../firebase/firebaseConfig.ts';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isFirstLaunch: boolean;
  setIsFirstLaunch: (value: boolean) => void;
  syncUserData: () => Promise<{ success: boolean; error?: string }>;
  backupData: () => Promise<{ success: boolean; error?: string }>;
  restoreData: () => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstLaunch, setIsFirstLaunch] = useState(true);

  useEffect(() => {
    // Check if this is the first launch
    const checkFirstLaunch = async () => {
      try {
        const hasLaunched = await AsyncStorage.getItem('hasLaunched');
        if (hasLaunched === null) {
          setIsFirstLaunch(true);
          await AsyncStorage.setItem('hasLaunched', 'true');
        } else {
          setIsFirstLaunch(false);
        }
      } catch (error) {
        console.error('Error checking first launch:', error);
        setIsFirstLaunch(false);
      }
    };

    checkFirstLaunch();

    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        // User logged in - sync their data
        console.log('🔄 User logged in, syncing data...');
        try {
          const syncResult = await syncService.syncUserData();
          if (syncResult.success) {
            console.log('Initial data sync completed');
          } else {
            console.warn('Initial sync failed:', syncResult.error);
          }
        } catch (error) {
          console.error('Sync error during login:', error);
        }
      }
      
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  // Auto-sync every 5 minutes when app is active
  useEffect(() => {
    let syncInterval: NodeJS.Timeout;
    
    if (user) {
      syncInterval = setInterval(async () => {
        if (syncService.shouldAutoSync()) {
          console.log('🔄 Auto-syncing user data...');
          await syncService.syncUserData();
        }
      }, 5 * 60 * 1000); // 5 minutes
    }
    
    return () => {
      if (syncInterval) clearInterval(syncInterval);
    };
  }, [user]);

  const value = {
    user,
    isLoading,
    isFirstLaunch,
    setIsFirstLaunch,
    syncUserData: () => syncService.syncUserData(true),
    backupData: () => syncService.backupToCloud(),
    restoreData: () => syncService.restoreFromCloud(),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 