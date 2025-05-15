import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  BALANCE: '@digitox_balance',
  TOTAL_EARNED: '@digitox_total_earned',
  TOTAL_TIME: '@digitox_total_time',
  DAILY_TIME: '@digitox_daily_time',
  LAST_RESET_DATE: '@digitox_last_reset_date',
  WEEKLY_PROGRESS: '@digitox_weekly_progress',
  WEEK_START_DATE: '@digitox_week_start_date',
};

export interface DigiStats {
  balance: number;
  totalEarned: number;
  totalTimeSaved: number;
  dailyTimeSaved: number;
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

    const [balance, totalEarned, totalTime, dailyTime] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.BALANCE),
      AsyncStorage.getItem(STORAGE_KEYS.TOTAL_EARNED),
      AsyncStorage.getItem(STORAGE_KEYS.TOTAL_TIME),
      AsyncStorage.getItem(STORAGE_KEYS.DAILY_TIME),
    ]);

    return {
      balance: balance ? parseFloat(balance) : 0,
      totalEarned: totalEarned ? parseFloat(totalEarned) : 0,
      totalTimeSaved: totalTime ? parseInt(totalTime) : 0,
      dailyTimeSaved: dailyTime ? parseInt(dailyTime) : 0,
    };
  } catch (error) {
    console.error('Error getting DigiStats:', error);
    return { balance: 0, totalEarned: 0, totalTimeSaved: 0, dailyTimeSaved: 0 };
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