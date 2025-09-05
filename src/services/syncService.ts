import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../../firebase/firebaseConfig';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { DetoxStats, WeeklyProgress } from '../utils/storage';

interface UserCloudData {
  profile: {
    email: string;
    firstName: string;
    lastName: string;
    displayName: string;
    createdAt: string;
    lastLoginAt: string;
  };
      stats: DetoxStats & {
    weeklyProgress: WeeklyProgress;
    lastSyncAt: string;
  };
  settings: {
    dailyGoal: number;
    notifications: boolean;
    theme: 'light' | 'dark';
  };
  achievements: any[];
  lastUpdated: any; // Firestore timestamp
}

class SyncService {
  private syncInProgress = false;
  private lastSyncTime = 0;
  private readonly SYNC_COOLDOWN = 30000; // 30 seconds
  private pendingSync = false; // Track if we need to sync when back online

  /**
   * Sync local data to Firebase and get updated data
   */
  async syncUserData(forceSync = false): Promise<{ success: boolean; error?: string }> {
    if (!auth.currentUser) {
      return { success: false, error: 'User not authenticated' };
    }

    if (this.syncInProgress && !forceSync) {
      return { success: false, error: 'Sync already in progress' };
    }

    const now = Date.now();
    if (now - this.lastSyncTime < this.SYNC_COOLDOWN && !forceSync) {
      return { success: false, error: 'Sync cooldown active' };
    }

    // Note: We'll handle offline errors in the catch block instead of pre-checking

    let localData: Partial<UserCloudData> = {};
    
    try {
      this.syncInProgress = true;
      this.lastSyncTime = now;

      const userId = auth.currentUser.uid;
      const userDocRef = doc(db, 'users', userId);

      // Get current local data
      localData = await this.getLocalUserData();
      
      // Get cloud data with timeout
      const cloudDoc = await Promise.race([
        getDoc(userDocRef),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Firebase request timeout')), 30000)
        )
      ]) as any;
      
      const cloudData = cloudDoc.exists() ? cloudDoc.data() as UserCloudData : null;

      // Determine which data is newer and merge accordingly
      const mergedData = await this.mergeUserData(localData, cloudData);

      // Update cloud with merged data
      await setDoc(userDocRef, {
        ...mergedData,
        lastUpdated: serverTimestamp(),
      }, { merge: true });

      // Update local storage with merged data
      await this.saveLocalUserData(mergedData);

      console.log('User data synced successfully');
      this.markSyncCompleted(); // Clear pending sync flag
      return { success: true };

    } catch (error: any) {
      // Handle specific Firebase offline errors
      if (error.message?.includes('offline') || error.message?.includes('Failed to get document') || error.message?.includes('timeout')) {
        console.log('Sync skipped: Firebase is offline or timeout - will retry when back online');
        this.pendingSync = true; // Mark that we need to sync when back online
        
        // Try to save local data anyway to ensure we have something
        try {
          if (localData && Object.keys(localData).length > 0) {
            await this.saveLocalUserData(localData);
          } else {
            console.log('No local data to save during offline');
          }
        } catch (saveError) {
          console.error('Error saving local data during offline:', saveError);
        }
        
        return { success: false, error: 'Firebase is offline' };
      }
      
      console.error('Sync failed:', error);
      return { success: false, error: error.message };
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Get user profile data directly from Firebase auth as fallback
   */
  async getUserProfileFromAuth(): Promise<{ firstName: string; lastName: string; displayName: string } | null> {
    try {
      console.log('getUserProfileFromAuth: Starting...');
      console.log('getUserProfileFromAuth: Auth object:', auth);
      console.log('getUserProfileFromAuth: Current user:', auth.currentUser);
      
      if (!auth.currentUser) {
        console.log('getUserProfileFromAuth: No current user');
        return null;
      }
      
      console.log('getUserProfileFromAuth: Current user ID:', auth.currentUser.uid);
      console.log('getUserProfileFromAuth: Current user email:', auth.currentUser.email);
      console.log('getUserProfileFromAuth: Current user displayName:', auth.currentUser.displayName);
      
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      console.log('getUserProfileFromAuth: Getting document from Firebase...');
      
      // Add timeout to prevent hanging
      const userDoc = await Promise.race([
        getDoc(userDocRef),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Firebase request timeout')), 15000)
        )
      ]) as any;
      
      console.log('getUserProfileFromAuth: Document exists:', userDoc.exists());
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        console.log('getUserProfileFromAuth: Document data:', data);
        
        // Check if firstName and lastName are null, missing, or empty strings
        if (!data.firstName || data.firstName === null || data.firstName === '' || 
            !data.lastName || data.lastName === null || data.lastName === '') {
          console.log('getUserProfileFromAuth: Profile data is incomplete, creating from email...');
          
          // Create profile from email
          const email = auth.currentUser.email || '';
          const emailName = email.split('@')[0] || 'User';
          const emailParts = emailName.split('.');
          
          const updatedProfile = {
            firstName: emailParts[0] || emailName,
            lastName: emailParts[1] || '',
            displayName: emailName,
          };
          
          console.log('getUserProfileFromAuth: Created profile from email:', updatedProfile);
          
          // Update the Firebase document with the new profile data
          try {
            await setDoc(userDocRef, {
              ...data, // Keep existing data
              firstName: updatedProfile.firstName,
              lastName: updatedProfile.lastName,
              displayName: updatedProfile.displayName,
              updatedAt: new Date().toISOString(),
            }, { merge: true });
            console.log('getUserProfileFromAuth: Updated Firebase document with profile data');
          } catch (updateError) {
            console.error('getUserProfileFromAuth: Error updating Firebase document:', updateError);
          }
          
          return updatedProfile;
        } else {
          // Profile data is valid, return it
          const profile = {
            firstName: data.firstName,
            lastName: data.lastName,
            displayName: data.displayName || `${data.firstName} ${data.lastName}`,
          };
          console.log('getUserProfileFromAuth: Returning existing valid profile:', profile);
          return profile;
        }
      }
      
      console.log('getUserProfileFromAuth: Document does not exist, creating basic profile...');
      console.log('getUserProfileFromAuth: User displayName:', auth.currentUser.displayName);
      console.log('getUserProfileFromAuth: User email:', auth.currentUser.email);
      
      // If document doesn't exist, create a basic profile with available data
      const displayName = auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'User';
      const nameParts = displayName.split(' ');
      const basicProfile = {
        firstName: nameParts[0] || 'User',
        lastName: nameParts[1] || '',
        displayName: displayName,
      };
      
      console.log('getUserProfileFromAuth: Created basic profile:', basicProfile);
      
      // Save this basic profile to Firebase
      try {
        await setDoc(userDocRef, {
          email: auth.currentUser.email || '',
          firstName: basicProfile.firstName,
          lastName: basicProfile.lastName,
          displayName: basicProfile.displayName,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        }, { merge: true });
        console.log('getUserProfileFromAuth: Basic profile created in Firebase');
      } catch (saveError) {
        console.error('getUserProfileFromAuth: Error saving basic profile:', saveError);
      }
      
      return basicProfile;
    } catch (error) {
      console.error('getUserProfileFromAuth: Error getting profile from auth:', error);
      
      // If Firebase is completely offline, create a basic profile from auth data
      if (auth.currentUser) {
        console.log('getUserProfileFromAuth: Creating offline fallback profile');
        const email = auth.currentUser.email || '';
        const emailName = email.split('@')[0] || 'User';
        
        const offlineProfile = {
          firstName: emailName,
          lastName: '',
          displayName: emailName,
        };
        
        console.log('getUserProfileFromAuth: Offline profile created:', offlineProfile);
        return offlineProfile;
      }
      
      return null;
    }
  }

  /**
   * Get all user data from local storage
   */
  private async getLocalUserData(): Promise<Partial<UserCloudData>> {
    try {
      const keys = [
        '@detoxly_balance',
        '@detoxly_total_earned',
        '@detoxly_total_time',
        '@detoxly_daily_time',
        '@detoxly_current_streak',
        '@detoxly_today_detox_time',
        '@detoxly_weekly_progress',
        '@detoxly_daily_goal',
        'userProfile',
      ];

      const values = await AsyncStorage.multiGet(keys);
      const data: any = {};

      values.forEach(([key, value]) => {
        if (value) {
          try {
            data[key] = JSON.parse(value);
          } catch {
            data[key] = value;
          }
        }
      });

      // Transform local data to cloud format
      return {
        stats: {
          balance: data['@detoxly_balance'] || 0,
          totalEarned: data['@detoxly_total_earned'] || 0,
          totalTimeSaved: data['@detoxly_total_time'] || 0,
          dailyTimeSaved: data['@detoxly_daily_time'] || 0,
          currentStreak: data['@detoxly_current_streak'] || 0,
          todayDetoxTime: data['@detoxly_today_detox_time'] || 0,
          weeklyProgress: data['@detoxly_weekly_progress'] || { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 },
          lastSyncAt: new Date().toISOString(),
        },
        settings: {
          dailyGoal: data['@detoxly_daily_goal'] || 120,
          notifications: true,
          theme: 'dark',
        },
        profile: data['userProfile'] || {
          email: auth.currentUser?.email || '',
          firstName: '',
          lastName: '',
          displayName: auth.currentUser?.displayName || '',
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        },
        achievements: [],
      };
    } catch (error) {
      console.error('Error getting local user data:', error);
      return {};
    }
  }

  /**
   * Save user data to local storage
   */
  private async saveLocalUserData(data: Partial<UserCloudData>): Promise<void> {
    try {
      const updates: [string, string][] = [];

      if (data.stats) {
        updates.push(['@detoxly_balance', JSON.stringify(data.stats.balance)]);
        updates.push(['@detoxly_total_earned', JSON.stringify(data.stats.totalEarned)]);
        updates.push(['@detoxly_total_time', JSON.stringify(data.stats.totalTimeSaved)]);
        updates.push(['@detoxly_daily_time', JSON.stringify(data.stats.dailyTimeSaved)]);
        updates.push(['@detoxly_current_streak', JSON.stringify(data.stats.currentStreak)]);
        updates.push(['@detoxly_today_detox_time', JSON.stringify(data.stats.todayDetoxTime)]);
        updates.push(['@detoxly_weekly_progress', JSON.stringify(data.stats.weeklyProgress)]);
      }

      if (data.settings) {
        updates.push(['@detoxly_daily_goal', JSON.stringify(data.settings.dailyGoal)]);
      }

      if (data.profile) {
        updates.push(['userProfile', JSON.stringify(data.profile)]);
      }

      await AsyncStorage.multiSet(updates);
    } catch (error) {
      console.error('Error saving local user data:', error);
    }
  }

  /**
   * Merge local and cloud data intelligently
   */
  private async mergeUserData(
    localData: Partial<UserCloudData>, 
    cloudData: UserCloudData | null
  ): Promise<Partial<UserCloudData>> {
    if (!cloudData) {
      // No cloud data, use local data
      return localData;
    }

    // Simple merge strategy - take higher values for stats, latest for settings
    const merged: Partial<UserCloudData> = {
      profile: {
        ...cloudData.profile,
        ...localData.profile,
        lastLoginAt: new Date().toISOString(),
      },
      stats: {
        // Take the higher values for cumulative stats
        balance: Math.max(localData.stats?.balance || 0, cloudData.stats?.balance || 0),
        totalEarned: Math.max(localData.stats?.totalEarned || 0, cloudData.stats?.totalEarned || 0),
        totalTimeSaved: Math.max(localData.stats?.totalTimeSaved || 0, cloudData.stats?.totalTimeSaved || 0),
        currentStreak: Math.max(localData.stats?.currentStreak || 0, cloudData.stats?.currentStreak || 0),
        
        // Take local data for daily stats (they reset daily anyway)
        dailyTimeSaved: localData.stats?.dailyTimeSaved || 0,
        todayDetoxTime: localData.stats?.todayDetoxTime || 0,
        
        // Merge weekly progress by taking max values per day
        weeklyProgress: this.mergeWeeklyProgress(
          localData.stats?.weeklyProgress,
          cloudData.stats?.weeklyProgress
        ),
        lastSyncAt: new Date().toISOString(),
      },
      settings: {
        // Use local settings if they exist, otherwise cloud settings
        ...cloudData.settings,
        ...localData.settings,
      },
      achievements: [...(cloudData.achievements || []), ...(localData.achievements || [])],
    };

    return merged;
  }

  /**
   * Merge weekly progress by taking max values
   */
  private mergeWeeklyProgress(
    local?: WeeklyProgress, 
    cloud?: WeeklyProgress
  ): WeeklyProgress {
    const defaultProgress: WeeklyProgress = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
    
    if (!local && !cloud) return defaultProgress;
    if (!local) return cloud!;
    if (!cloud) return local;

    return {
      Sun: Math.max(local.Sun, cloud.Sun),
      Mon: Math.max(local.Mon, cloud.Mon),
      Tue: Math.max(local.Tue, cloud.Tue),
      Wed: Math.max(local.Wed, cloud.Wed),
      Thu: Math.max(local.Thu, cloud.Thu),
      Fri: Math.max(local.Fri, cloud.Fri),
      Sat: Math.max(local.Sat, cloud.Sat),
    };
  }

  /**
   * Force upload local data to cloud (for backup)
   */
  async backupToCloud(): Promise<{ success: boolean; error?: string }> {
    if (!auth.currentUser) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const userId = auth.currentUser.uid;
      const userDocRef = doc(db, 'users', userId);
      const localData = await this.getLocalUserData();

      await setDoc(userDocRef, {
        ...localData,
        lastUpdated: serverTimestamp(),
      }, { merge: true });

      console.log('Data backed up to cloud');
      return { success: true };
    } catch (error: any) {
      console.error('Backup failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Download data from cloud and overwrite local (for restore)
   */
  async restoreFromCloud(): Promise<{ success: boolean; error?: string }> {
    if (!auth.currentUser) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const userId = auth.currentUser.uid;
      const userDocRef = doc(db, 'users', userId);
      const cloudDoc = await getDoc(userDocRef);

      if (!cloudDoc.exists()) {
        return { success: false, error: 'No cloud data found' };
      }

      const cloudData = cloudDoc.data() as UserCloudData;
      await this.saveLocalUserData(cloudData);

      console.log('Data restored from cloud');
      return { success: true };
    } catch (error: any) {
      console.error('Restore failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if sync is needed based on time since last sync
   */
  shouldAutoSync(): boolean {
    const now = Date.now();
    return now - this.lastSyncTime > this.SYNC_COOLDOWN || this.pendingSync;
  }

  /**
   * Mark sync as completed (clears pending flag)
   */
  private markSyncCompleted(): void {
    this.pendingSync = false;
  }

  /**
   * Check if there's a pending sync due to offline issues
   */
  hasPendingSync(): boolean {
    return this.pendingSync;
  }
}

export const syncService = new SyncService();
export default syncService;