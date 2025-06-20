import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  BALANCE: '@digitox_balance',
  TOTAL_EARNED: '@digitox_total_earned',
  TOTAL_TIME: '@digitox_total_time',
  DAILY_TIME: '@digitox_daily_time',
  LAST_RESET_DATE: '@digitox_last_reset_date',
  WEEKLY_PROGRESS: '@digitox_weekly_progress',
  WEEK_START_DATE: '@digitox_week_start_date',
  CURRENT_STREAK: '@digitox_current_streak',
  LAST_ACTIVITY_DATE: '@digitox_last_activity_date',
  DAILY_GOAL: '@digitox_daily_goal',
  WEEKLY_GOAL: '@digitox_weekly_goal',
  GOALS_COMPLETED: '@digitox_goals_completed',
  DETOX_SESSIONS: '@digitox_detox_sessions',
  TODAY_DETOX_TIME: '@digitox_today_detox_time',
};

// Storage keys
const REDEEMED_REWARDS_KEY = '@digitox_redeemed_rewards';

export interface DigiStats {
  balance: number;
  totalEarned: number;
  totalTimeSaved: number;
  dailyTimeSaved: number;
  currentStreak: number;
  todayDetoxTime: number;
}

export interface WeeklyProgress {
  Sun: number;
  Mon: number;
  Tue: number;
  Wed: number;
  Thu: number;
  Fri: number;
  Sat: number;
}

export interface DetoxSession {
  startTime: string;
  endTime: string;
  duration: number; // in seconds
}

export interface Goals {
  dailyGoal: number; // in hours
  weeklyGoal: number; // in hours
  goalsCompleted: number;
}

// Interface for redeemed rewards
export interface RedeemedReward {
  id: string;
  redeemedAt: string;
  expiresAt: string;
  usesLeft: number;
}

export const DIGICOINS_BALANCE_KEY = 'digicoins_balance';
export const TOTAL_DIGICOINS_EARNED_KEY = 'total_digicoins_earned';

export const PROMO_CODES_KEY = 'promo_codes';

interface PromoCode {
  id: string;
  userId: string;
  code: string;
  offerId: string;
  isUsed: boolean;
  expiresAt: string;
  createdAt: string;
}

const shouldResetDaily = async (): Promise<boolean> => {
  const lastResetDate = await AsyncStorage.getItem(STORAGE_KEYS.LAST_RESET_DATE);
  if (!lastResetDate) return true;

  const lastReset = new Date(lastResetDate);
  const now = new Date();
  
  // Extract just the date parts for comparison (ignoring time)
  const lastResetDay = new Date(
    lastReset.getFullYear(),
    lastReset.getMonth(),
    lastReset.getDate()
  );
  
  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  
  // Return true if we've crossed midnight to a new day
  return today.getTime() > lastResetDay.getTime();
};

const shouldResetWeekly = async (): Promise<boolean> => {
  const weekStartDate = await AsyncStorage.getItem(STORAGE_KEYS.WEEK_START_DATE);
  if (!weekStartDate) return true;

  const weekStart = new Date(weekStartDate);
  const now = new Date();
  
  // Calculate days since week start (reset every 7 days)
  const diffTime = Math.abs(now.getTime() - weekStart.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays >= 7;
};

const resetDailyStats = async () => {
  await Promise.all([
    AsyncStorage.setItem(STORAGE_KEYS.DAILY_TIME, '0'),
    AsyncStorage.setItem(STORAGE_KEYS.LAST_RESET_DATE, new Date().toISOString()),
    AsyncStorage.setItem(STORAGE_KEYS.TODAY_DETOX_TIME, '0'),
  ]);
};

const resetWeeklyStats = async () => {
  const emptyWeeklyProgress: WeeklyProgress = {
    Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0
  };
  
  await Promise.all([
    AsyncStorage.setItem(STORAGE_KEYS.WEEKLY_PROGRESS, JSON.stringify(emptyWeeklyProgress)),
    AsyncStorage.setItem(STORAGE_KEYS.WEEK_START_DATE, new Date().toISOString()),
  ]);
};

export const getDigiStats = async (): Promise<DigiStats> => {
  try {
    // Check if we need to reset daily stats
    if (await shouldResetDaily()) {
      await resetDailyStats();
    }

    const [balance, totalEarned, totalTime, dailyTime, currentStreak, todayDetoxTime] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.BALANCE),
      AsyncStorage.getItem(STORAGE_KEYS.TOTAL_EARNED),
      AsyncStorage.getItem(STORAGE_KEYS.TOTAL_TIME),
      AsyncStorage.getItem(STORAGE_KEYS.DAILY_TIME),
      AsyncStorage.getItem(STORAGE_KEYS.CURRENT_STREAK),
      AsyncStorage.getItem(STORAGE_KEYS.TODAY_DETOX_TIME),
    ]);

    return {
      balance: balance ? parseFloat(balance) : 0,
      totalEarned: totalEarned ? parseFloat(totalEarned) : 0,
      totalTimeSaved: totalTime ? parseInt(totalTime) : 0,
      dailyTimeSaved: dailyTime ? parseInt(dailyTime) : 0,
      currentStreak: currentStreak ? parseInt(currentStreak) : 0,
      todayDetoxTime: todayDetoxTime ? parseInt(todayDetoxTime) : 0,
    };
  } catch (error) {
    console.error('Error getting DigiStats:', error);
    return { 
      balance: 0, 
      totalEarned: 0, 
      totalTimeSaved: 0, 
      dailyTimeSaved: 0, 
      currentStreak: 0,
      todayDetoxTime: 0,
    };
  }
};

export const getWeeklyProgress = async (): Promise<WeeklyProgress> => {
  try {
    // Check if we need to reset weekly stats
    if (await shouldResetWeekly()) {
      await resetWeeklyStats();
    }

    const weeklyProgressStr = await AsyncStorage.getItem(STORAGE_KEYS.WEEKLY_PROGRESS);
    if (!weeklyProgressStr) {
      // Initialize with empty data if not available
      const emptyProgress: WeeklyProgress = {
        Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0
      };
      await AsyncStorage.setItem(STORAGE_KEYS.WEEKLY_PROGRESS, JSON.stringify(emptyProgress));
      return emptyProgress;
    }
    
    return JSON.parse(weeklyProgressStr) as WeeklyProgress;
  } catch (error) {
    console.error('Error getting weekly progress:', error);
    return { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
  }
};

export const updateWeeklyProgress = async (dayOfWeek: number, timeSpent: number) => {
  try {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
    const day = days[dayOfWeek];
    
    // Get current weekly progress
    const weeklyProgress = await getWeeklyProgress();
    
    // Update for today
    weeklyProgress[day] = timeSpent;
    
    // Save updated progress
    await AsyncStorage.setItem(STORAGE_KEYS.WEEKLY_PROGRESS, JSON.stringify(weeklyProgress));
    
    return weeklyProgress;
  } catch (error) {
    console.error('Error updating weekly progress:', error);
    return null;
  }
};

export const updateDigiStats = async (earnedAmount: number, timeSpent: number) => {
  try {
    // Check if we need to reset daily stats
    if (await shouldResetDaily()) {
      await resetDailyStats();
    }

    const currentStats = await getDigiStats();
    const newStats: DigiStats = {
      balance: currentStats.balance + earnedAmount,
      totalEarned: currentStats.totalEarned + earnedAmount,
      totalTimeSaved: currentStats.totalTimeSaved + timeSpent,
      dailyTimeSaved: currentStats.dailyTimeSaved + timeSpent,
      currentStreak: currentStats.currentStreak,
      todayDetoxTime: currentStats.todayDetoxTime,
    };

    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.BALANCE, newStats.balance.toString()),
      AsyncStorage.setItem(STORAGE_KEYS.TOTAL_EARNED, newStats.totalEarned.toString()),
      AsyncStorage.setItem(STORAGE_KEYS.TOTAL_TIME, newStats.totalTimeSaved.toString()),
      AsyncStorage.setItem(STORAGE_KEYS.DAILY_TIME, newStats.dailyTimeSaved.toString()),
    ]);
    
    // Also update weekly progress
    const today = new Date().getDay();
    await updateWeeklyProgress(today, Math.floor(newStats.dailyTimeSaved / 60));

    return newStats;
  } catch (error) {
    console.error('Error updating DigiStats:', error);
    return null;
  }
};

export const checkAndResetDailyStats = async (): Promise<void> => {
  try {
    const lastResetDate = await AsyncStorage.getItem(STORAGE_KEYS.LAST_RESET_DATE);
    if (!lastResetDate) {
      await resetDailyStats();
      return;
    }

    const lastReset = new Date(lastResetDate);
    const now = new Date();
    
    // Extract just the date parts for comparison (ignoring time)
    const lastResetDay = new Date(
      lastReset.getFullYear(),
      lastReset.getMonth(),
      lastReset.getDate()
    );
    
    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    
    // If we've crossed midnight to a new day
    if (today.getTime() > lastResetDay.getTime()) {
      console.log('New day detected, resetting daily stats');
      
      // Save yesterday's progress to the weekly data before resetting
      const yesterdayDay = lastReset.getDay();
      const dailyTimeStr = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_TIME);
      const dailyTimeSeconds = dailyTimeStr ? parseInt(dailyTimeStr, 10) : 0;
      const dailyTimeMinutes = Math.floor(dailyTimeSeconds / 60);
      
      // Get current weekly progress and update yesterday's value
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
      const yesterdayKey = days[yesterdayDay];
      
      const weeklyProgressStr = await AsyncStorage.getItem(STORAGE_KEYS.WEEKLY_PROGRESS);
      let weeklyProgress: WeeklyProgress;
      
      if (weeklyProgressStr) {
        weeklyProgress = JSON.parse(weeklyProgressStr);
      } else {
        weeklyProgress = {
          Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0
        };
      }
      
      // Update the previous day's progress
      weeklyProgress[yesterdayKey] = dailyTimeMinutes;
      
      // Save the updated weekly progress
      await AsyncStorage.setItem(STORAGE_KEYS.WEEKLY_PROGRESS, JSON.stringify(weeklyProgress));
      
      // Then reset daily stats for today
      await resetDailyStats();
    }
  } catch (error) {
    console.error('Error checking for daily reset:', error);
  }
};

// Add this new function to reset everything to zero
export const resetAllStatsToZero = async (): Promise<void> => {
  try {
    console.log('Resetting all stats to zero for testing');
    
    // Reset daily stats
    await AsyncStorage.setItem(STORAGE_KEYS.DAILY_TIME, '0');
    
    // Reset balance and earnings (optional, comment out if you want to keep these)
    await AsyncStorage.setItem(STORAGE_KEYS.BALANCE, '0');
    await AsyncStorage.setItem(STORAGE_KEYS.TOTAL_EARNED, '0');
    await AsyncStorage.setItem(STORAGE_KEYS.TOTAL_TIME, '0');
    
    // Reset last reset date to now
    const now = new Date();
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_RESET_DATE, now.toISOString());
    
    // Reset weekly progress
    const emptyWeeklyProgress: WeeklyProgress = {
      Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0
    };
    
    await AsyncStorage.setItem(STORAGE_KEYS.WEEKLY_PROGRESS, JSON.stringify(emptyWeeklyProgress));
    await AsyncStorage.setItem(STORAGE_KEYS.WEEK_START_DATE, now.toISOString());
    
    console.log('All stats reset to zero');
  } catch (error) {
    console.error('Error resetting stats:', error);
  }
};

export const updateStreak = async (): Promise<number> => {
  try {
    const lastActivityDate = await AsyncStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY_DATE);
    const currentStreak = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_STREAK);
    const now = new Date();
    
    if (!lastActivityDate) {
      // First activity
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY_DATE, now.toISOString()),
        AsyncStorage.setItem(STORAGE_KEYS.CURRENT_STREAK, '1'),
      ]);
      return 1;
    }

    const lastActivity = new Date(lastActivityDate);
    const daysSinceLastActivity = Math.floor(
      (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
    );

    let newStreak = currentStreak ? parseInt(currentStreak) : 0;

    if (daysSinceLastActivity === 1) {
      // Consecutive day
      newStreak += 1;
    } else if (daysSinceLastActivity > 1) {
      // Streak broken
      newStreak = 1;
    }

    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY_DATE, now.toISOString()),
      AsyncStorage.setItem(STORAGE_KEYS.CURRENT_STREAK, newStreak.toString()),
    ]);

    return newStreak;
  } catch (error) {
    console.error('Error updating streak:', error);
    return 0;
  }
};

export const getGoals = async (): Promise<Goals> => {
  try {
    const [dailyGoal, weeklyGoal, goalsCompleted] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.DAILY_GOAL),
      AsyncStorage.getItem(STORAGE_KEYS.WEEKLY_GOAL),
      AsyncStorage.getItem(STORAGE_KEYS.GOALS_COMPLETED),
    ]);

    return {
      dailyGoal: dailyGoal ? parseInt(dailyGoal) : 6, // Default 6 hours
      weeklyGoal: weeklyGoal ? parseInt(weeklyGoal) : 42, // Default 42 hours
      goalsCompleted: goalsCompleted ? parseInt(goalsCompleted) : 0,
    };
  } catch (error) {
    console.error('Error getting goals:', error);
    return { dailyGoal: 6, weeklyGoal: 42, goalsCompleted: 0 };
  }
};

export const updateGoals = async (dailyGoal: number, weeklyGoal: number): Promise<Goals> => {
  try {
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.DAILY_GOAL, dailyGoal.toString()),
      AsyncStorage.setItem(STORAGE_KEYS.WEEKLY_GOAL, weeklyGoal.toString()),
    ]);

    return await getGoals();
  } catch (error) {
    console.error('Error updating goals:', error);
    return { dailyGoal: 6, weeklyGoal: 42, goalsCompleted: 0 };
  }
};

export const checkAndUpdateGoals = async (timeSpent: number): Promise<Goals> => {
  try {
    const goals = await getGoals();
    const stats = await getDigiStats();
    
    // Convert timeSpent from seconds to hours
    const timeSpentHours = timeSpent / 3600;
    const dailyTimeSpentHours = stats.dailyTimeSaved / 3600;
    
    let goalsCompleted = goals.goalsCompleted;
    
    // Check if daily goal is completed
    if (dailyTimeSpentHours >= goals.dailyGoal) {
      goalsCompleted += 1;
      await AsyncStorage.setItem(STORAGE_KEYS.GOALS_COMPLETED, goalsCompleted.toString());
    }
    
    return {
      ...goals,
      goalsCompleted,
    };
  } catch (error) {
    console.error('Error checking goals:', error);
    return { dailyGoal: 6, weeklyGoal: 42, goalsCompleted: 0 };
  }
};

export const addDetoxSession = async (session: DetoxSession): Promise<DigiStats> => {
  try {
    // Get current sessions
    const sessionsStr = await AsyncStorage.getItem(STORAGE_KEYS.DETOX_SESSIONS);
    const sessions: DetoxSession[] = sessionsStr ? JSON.parse(sessionsStr) : [];
    
    // Add new session
    sessions.push(session);
    
    // Save updated sessions
    await AsyncStorage.setItem(STORAGE_KEYS.DETOX_SESSIONS, JSON.stringify(sessions));
    
    // Update today's detox time
    const todayDetoxTimeStr = await AsyncStorage.getItem(STORAGE_KEYS.TODAY_DETOX_TIME);
    const todayDetoxTime = todayDetoxTimeStr ? parseInt(todayDetoxTimeStr) : 0;
    const newTodayDetoxTime = todayDetoxTime + session.duration;
    await AsyncStorage.setItem(STORAGE_KEYS.TODAY_DETOX_TIME, newTodayDetoxTime.toString());
    
    // Get updated stats
    const stats = await getDigiStats();
    return {
      ...stats,
      todayDetoxTime: newTodayDetoxTime,
    };
  } catch (error) {
    console.error('Error adding detox session:', error);
    return await getDigiStats();
  }
};

// Get all redeemed rewards
export const getRedeemedRewards = async (): Promise<RedeemedReward[]> => {
  try {
    const rewards = await AsyncStorage.getItem(REDEEMED_REWARDS_KEY);
    return rewards ? JSON.parse(rewards) : [];
  } catch (error) {
    console.error('Error getting redeemed rewards:', error);
    return [];
  }
};

// Add a redeemed reward
export const addRedeemedReward = async (reward: RedeemedReward): Promise<boolean> => {
  try {
    const rewards = await getRedeemedRewards();
    rewards.push(reward);
    await AsyncStorage.setItem(REDEEMED_REWARDS_KEY, JSON.stringify(rewards));
    return true;
  } catch (error) {
    console.error('Error adding redeemed reward:', error);
    return false;
  }
};

// Update uses left for a redeemed reward
export const updateRedeemedRewardUses = async (rewardId: string, usesLeft: number): Promise<boolean> => {
  try {
    const rewards = await getRedeemedRewards();
    const updatedRewards = rewards.map(reward => 
      reward.id === rewardId ? { ...reward, usesLeft } : reward
    );
    await AsyncStorage.setItem(REDEEMED_REWARDS_KEY, JSON.stringify(updatedRewards));
    return true;
  } catch (error) {
    console.error('Error updating redeemed reward:', error);
    return false;
  }
};

// Check if user has enough Digicoins
export const hasEnoughDigicoins = async (requiredAmount: number): Promise<boolean> => {
  const stats = await getDigiStats();
  return stats.balance >= requiredAmount;
};

// Utility function to round up to 2 decimal places
const roundUpToTwoDecimals = (num: number): number => {
  return Math.ceil(num * 100) / 100;
};

export const getDigicoinsBalance = async (): Promise<number> => {
  try {
    const balance = await AsyncStorage.getItem(DIGICOINS_BALANCE_KEY);
    if (!balance) {
      // Set initial balance to 1000 if no balance exists
      await AsyncStorage.setItem(DIGICOINS_BALANCE_KEY, '1000');
      return 1000;
    }
    return roundUpToTwoDecimals(parseFloat(balance));
  } catch (error) {
    console.error('Error getting Digicoins balance:', error);
    return 1000; // Return 1000 as default in case of error
  }
};

// Function to reset balance to 1000 (for testing)
export const resetDigicoinsBalance = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(DIGICOINS_BALANCE_KEY, '1000');
  } catch (error) {
    console.error('Error resetting Digicoins balance:', error);
  }
};

export const getTotalDigicoinsEarned = async (): Promise<number> => {
  try {
    const total = await AsyncStorage.getItem(TOTAL_DIGICOINS_EARNED_KEY);
    return total ? roundUpToTwoDecimals(parseFloat(total)) : 0;
  } catch (error) {
    console.error('Error getting total Digicoins earned:', error);
    return 0;
  }
};

export const deductDigicoins = async (amount: number): Promise<boolean> => {
  try {
    const currentBalance = await getDigicoinsBalance();
    const newBalance = roundUpToTwoDecimals(currentBalance - amount);
    
    if (newBalance < 0) {
      return false;
    }

    // Update current balance
    await AsyncStorage.setItem(DIGICOINS_BALANCE_KEY, newBalance.toString());
    
    // Update total earned
    const totalEarned = await getTotalDigicoinsEarned();
    await AsyncStorage.setItem(TOTAL_DIGICOINS_EARNED_KEY, roundUpToTwoDecimals(totalEarned + amount).toString());
    
    return true;
  } catch (error) {
    console.error('Error deducting Digicoins:', error);
    return false;
  }
};

export const addDigicoins = async (amount: number): Promise<boolean> => {
  try {
    const currentBalance = await getDigicoinsBalance();
    const newBalance = roundUpToTwoDecimals(currentBalance + amount);
    
    // Update current balance
    await AsyncStorage.setItem(DIGICOINS_BALANCE_KEY, newBalance.toString());
    
    // Update total earned
    const totalEarned = await getTotalDigicoinsEarned();
    await AsyncStorage.setItem(TOTAL_DIGICOINS_EARNED_KEY, roundUpToTwoDecimals(totalEarned + amount).toString());
    
    return true;
  } catch (error) {
    console.error('Error adding Digicoins:', error);
    return false;
  }
};

// Generate a unique promo code
const generatePromoCode = (length = 10): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

// Get all promo codes for a user
export const getUserPromoCodes = async (userId: string): Promise<PromoCode[]> => {
  try {
    const codes = await AsyncStorage.getItem(PROMO_CODES_KEY);
    if (!codes) return [];
    
    const allCodes: PromoCode[] = JSON.parse(codes);
    return allCodes.filter(code => code.userId === userId);
  } catch (error) {
    console.error('Error getting user promo codes:', error);
    return [];
  }
};

// Get a specific promo code for an offer
export const getPromoCodeForOffer = async (userId: string, offerId: string): Promise<PromoCode | null> => {
  try {
    const codes = await getUserPromoCodes(userId);
    return codes.find(code => code.offerId === offerId && !code.isUsed) || null;
  } catch (error) {
    console.error('Error getting promo code for offer:', error);
    return null;
  }
};

// Generate and store a new promo code
export const generateAndStorePromoCode = async (
  userId: string,
  offerId: string,
  expiresAt?: string
): Promise<PromoCode> => {
  try {
    // Check if user already has an unused code for this offer
    const existingCode = await getPromoCodeForOffer(userId, offerId);
    if (existingCode) {
      return existingCode;
    }

    const newCode: PromoCode = {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      code: generatePromoCode(),
      offerId,
      isUsed: false,
      expiresAt: expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days default
      createdAt: new Date().toISOString()
    };

    // Get existing codes
    const existingCodes = await AsyncStorage.getItem(PROMO_CODES_KEY);
    const allCodes: PromoCode[] = existingCodes ? JSON.parse(existingCodes) : [];

    // Add new code
    allCodes.push(newCode);

    // Save updated codes
    await AsyncStorage.setItem(PROMO_CODES_KEY, JSON.stringify(allCodes));

    return newCode;
  } catch (error) {
    console.error('Error generating promo code:', error);
    throw error;
  }
};

// Mark a promo code as used
export const markPromoCodeAsUsed = async (codeId: string): Promise<boolean> => {
  try {
    const codes = await AsyncStorage.getItem(PROMO_CODES_KEY);
    if (!codes) return false;

    const allCodes: PromoCode[] = JSON.parse(codes);
    const updatedCodes = allCodes.map(code => 
      code.id === codeId ? { ...code, isUsed: true } : code
    );

    await AsyncStorage.setItem(PROMO_CODES_KEY, JSON.stringify(updatedCodes));
    return true;
  } catch (error) {
    console.error('Error marking promo code as used:', error);
    return false;
  }
};

export const REDEMPTIONS_COUNT_KEY = 'redemptions_count';

// Get total number of redemptions
export const getRedemptionsCount = async (): Promise<number> => {
  try {
    const count = await AsyncStorage.getItem(REDEMPTIONS_COUNT_KEY);
    return count ? parseInt(count, 10) : 0;
  } catch (error) {
    console.error('Error getting redemptions count:', error);
    return 0;
  }
};

// Increment redemptions count
export const incrementRedemptionsCount = async (): Promise<void> => {
  try {
    const currentCount = await getRedemptionsCount();
    await AsyncStorage.setItem(REDEMPTIONS_COUNT_KEY, (currentCount + 1).toString());
  } catch (error) {
    console.error('Error incrementing redemptions count:', error);
  }
};

// Update stats when redeeming an offer
export const updateStatsOnRedemption = async (digicoinsAmount: number): Promise<void> => {
  try {
    // Update total earned
    const totalEarned = await getTotalDigicoinsEarned();
    await AsyncStorage.setItem(TOTAL_DIGICOINS_EARNED_KEY, (totalEarned + digicoinsAmount).toString());
    
    // Increment redemptions count
    await incrementRedemptionsCount();
  } catch (error) {
    console.error('Error updating stats on redemption:', error);
  }
}; 