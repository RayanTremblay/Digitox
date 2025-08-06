import AsyncStorage from '@react-native-async-storage/async-storage';
import adManager from './adManager';

const BOOST_DATA_KEY = 'boostData';

export interface BoostData {
  isAdBoostActive: boolean;
  adBoostActivatedAt?: Date;
  adBoostExpiresAt?: Date;
  totalAdBoostsUsed: number;
  date: string; // YYYY-MM-DD format
}

// Boost duration in milliseconds (e.g., 2 hours)
const AD_BOOST_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours

// Get today's date in YYYY-MM-DD format
const getTodayString = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// Get or create boost data
export const getBoostData = async (): Promise<BoostData> => {
  try {
    const stored = await AsyncStorage.getItem(BOOST_DATA_KEY);
    const today = getTodayString();
    
    if (stored) {
      const data = JSON.parse(stored);
      
      // Convert date strings back to Date objects
      if (data.adBoostActivatedAt) {
        data.adBoostActivatedAt = new Date(data.adBoostActivatedAt);
      }
      if (data.adBoostExpiresAt) {
        data.adBoostExpiresAt = new Date(data.adBoostExpiresAt);
      }
      
      // Reset daily data if it's a new day
      if (data.date !== today) {
        data.date = today;
        data.isAdBoostActive = false;
        data.adBoostActivatedAt = undefined;
        data.adBoostExpiresAt = undefined;
        // Keep totalAdBoostsUsed as cumulative
      }
      
      // Check if ad boost has expired
      if (data.isAdBoostActive && data.adBoostExpiresAt && new Date() > data.adBoostExpiresAt) {
        data.isAdBoostActive = false;
        data.adBoostActivatedAt = undefined;
        data.adBoostExpiresAt = undefined;
      }
      
      return data;
    }
    
    // Create new boost data
    const newData: BoostData = {
      isAdBoostActive: false,
      totalAdBoostsUsed: 0,
      date: today,
    };
    
    await AsyncStorage.setItem(BOOST_DATA_KEY, JSON.stringify(newData));
    return newData;
  } catch (error) {
    console.error('Error getting boost data:', error);
    throw error;
  }
};

// Check if ad boost is currently active
export const isAdBoostActive = async (): Promise<boolean> => {
  try {
    const data = await getBoostData();
    return data.isAdBoostActive;
  } catch (error) {
    console.error('Error checking ad boost status:', error);
    return false;
  }
};

// Get remaining boost time in minutes
export const getRemainingBoostTime = async (): Promise<number> => {
  try {
    const data = await getBoostData();
    if (!data.isAdBoostActive || !data.adBoostExpiresAt) {
      return 0;
    }
    
    const remaining = data.adBoostExpiresAt.getTime() - Date.now();
    return Math.max(0, Math.floor(remaining / 60000)); // Convert to minutes
  } catch (error) {
    console.error('Error getting remaining boost time:', error);
    return 0;
  }
};

// Activate 2x boost by watching an ad
export const activateAdBoost = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    // Check if boost is already active
    const currentData = await getBoostData();
    if (currentData.isAdBoostActive) {
      return {
        success: false,
        error: '2x boost is already active!'
      };
    }
    
    // Show rewarded ad
    const adResult = await adManager.showRewardedAd();
    if (!adResult.success) {
      return {
        success: false,
        error: 'Ad was skipped or failed to load. Please try again.'
      };
    }
    
    // Activate the boost
    const now = new Date();
    const expiresAt = new Date(now.getTime() + AD_BOOST_DURATION_MS);
    
    const updatedData: BoostData = {
      ...currentData,
      isAdBoostActive: true,
      adBoostActivatedAt: now,
      adBoostExpiresAt: expiresAt,
      totalAdBoostsUsed: currentData.totalAdBoostsUsed + 1,
    };
    
    await AsyncStorage.setItem(BOOST_DATA_KEY, JSON.stringify(updatedData));
    
    console.log('✅ 2x boost activated via ad!', {
      activatedAt: now,
      expiresAt: expiresAt,
      duration: `${AD_BOOST_DURATION_MS / 60000} minutes`
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error activating ad boost:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.'
    };
  }
};

// Get boost stats for display
export const getBoostStats = async (): Promise<{
  isAdBoostActive: boolean;
  remainingMinutes: number;
  totalAdBoostsUsed: number;
  canActivateAdBoost: boolean;
}> => {
  try {
    const data = await getBoostData();
    const remainingMinutes = await getRemainingBoostTime();
    
    return {
      isAdBoostActive: data.isAdBoostActive,
      remainingMinutes,
      totalAdBoostsUsed: data.totalAdBoostsUsed,
      canActivateAdBoost: !data.isAdBoostActive,
    };
  } catch (error) {
    console.error('Error getting boost stats:', error);
    return {
      isAdBoostActive: false,
      remainingMinutes: 0,
      totalAdBoostsUsed: 0,
      canActivateAdBoost: true,
    };
  }
};

// Check if user should get 2x multiplier (either automatic or ad-based)
export const shouldApplyBoostMultiplier = async (currentTimeMinutes: number): Promise<{ multiplier: number; reason: string }> => {
  try {
    const BOOST_THRESHOLD_MINUTES = 180; // 3 hours
    const isAdActive = await isAdBoostActive();
    
    // Check ad boost first (takes priority)
    if (isAdActive) {
      return { multiplier: 2, reason: 'ad_boost' };
    }
    
    // Check automatic boost
    if (currentTimeMinutes >= BOOST_THRESHOLD_MINUTES) {
      return { multiplier: 2, reason: 'time_based' };
    }
    
    return { multiplier: 1, reason: 'none' };
  } catch (error) {
    console.error('Error checking boost multiplier:', error);
    return { multiplier: 1, reason: 'error' };
  }
};

export default {
  getBoostData,
  isAdBoostActive,
  getRemainingBoostTime,
  activateAdBoost,
  getBoostStats,
  shouldApplyBoostMultiplier,
};