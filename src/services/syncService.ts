import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../../firebase/firebaseConfig.ts';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { DigiStats, WeeklyProgress } from '../utils/storage';

interface UserCloudData {
  profile: {
    email: string;
    firstName: string;
    lastName: string;
    displayName: string;
    createdAt: string;
    lastLoginAt: string;
  };
  stats: DigiStats & {
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

    try {
      this.syncInProgress = true;
      this.lastSyncTime = now;

      const userId = auth.currentUser.uid;
      const userDocRef = doc(db, 'users', userId);

      // Get current local data
      const localData = await this.getLocalUserData();
      
      // Get cloud data
      const cloudDoc = await getDoc(userDocRef);
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

      console.log('✅ User data synced successfully');
      return { success: true };

    } catch (error: any) {
      console.error('❌ Sync failed:', error);
      return { success: false, error: error.message };
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Get all user data from local storage
   */
  private async getLocalUserData(): Promise<Partial<UserCloudData>> {
    try {
      const keys = [
        '@digitox_balance',
        '@digitox_total_earned',
        '@digitox_total_time',
        '@digitox_daily_time',
        '@digitox_current_streak',
        '@digitox_today_detox_time',
        '@digitox_weekly_progress',
        '@digitox_daily_goal',
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
          balance: data['@digitox_balance'] || 0,
          totalEarned: data['@digitox_total_earned'] || 0,
          totalTimeSaved: data['@digitox_total_time'] || 0,
          dailyTimeSaved: data['@digitox_daily_time'] || 0,
          currentStreak: data['@digitox_current_streak'] || 0,
          todayDetoxTime: data['@digitox_today_detox_time'] || 0,
          weeklyProgress: data['@digitox_weekly_progress'] || { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 },
          lastSyncAt: new Date().toISOString(),
        },
        settings: {
          dailyGoal: data['@digitox_daily_goal'] || 120,
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
        updates.push(['@digitox_balance', JSON.stringify(data.stats.balance)]);
        updates.push(['@digitox_total_earned', JSON.stringify(data.stats.totalEarned)]);
        updates.push(['@digitox_total_time', JSON.stringify(data.stats.totalTimeSaved)]);
        updates.push(['@digitox_daily_time', JSON.stringify(data.stats.dailyTimeSaved)]);
        updates.push(['@digitox_current_streak', JSON.stringify(data.stats.currentStreak)]);
        updates.push(['@digitox_today_detox_time', JSON.stringify(data.stats.todayDetoxTime)]);
        updates.push(['@digitox_weekly_progress', JSON.stringify(data.stats.weeklyProgress)]);
      }

      if (data.settings) {
        updates.push(['@digitox_daily_goal', JSON.stringify(data.settings.dailyGoal)]);
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

      console.log('✅ Data backed up to cloud');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Backup failed:', error);
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

      console.log('✅ Data restored from cloud');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Restore failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if sync is needed based on time since last sync
   */
  shouldAutoSync(): boolean {
    const now = Date.now();
    return now - this.lastSyncTime > this.SYNC_COOLDOWN;
  }
}

export const syncService = new SyncService();
export default syncService;