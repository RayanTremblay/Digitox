import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  BALANCE: '@digitox_balance',
  TOTAL_EARNED: '@digitox_total_earned',
  TOTAL_TIME: '@digitox_total_time',
  DAILY_TIME: '@digitox_daily_time',
  LAST_RESET_DATE: '@digitox_last_reset_date',
};

export interface DigiStats {
  balance: number;
  totalEarned: number;
  totalTimeSaved: number;
  dailyTimeSaved: number;
}

const shouldResetDaily = async (): Promise<boolean> => {
  const lastResetDate = await AsyncStorage.getItem(STORAGE_KEYS.LAST_RESET_DATE);
  if (!lastResetDate) return true;

  const lastReset = new Date(lastResetDate);
  const now = new Date();
  
  // Check if it's a new day (past midnight)
  return lastReset.getDate() !== now.getDate() ||
         lastReset.getMonth() !== now.getMonth() ||
         lastReset.getFullYear() !== now.getFullYear();
};

const resetDailyStats = async () => {
  await Promise.all([
    AsyncStorage.setItem(STORAGE_KEYS.DAILY_TIME, '0'),
    AsyncStorage.setItem(STORAGE_KEYS.LAST_RESET_DATE, new Date().toISOString()),
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

    return newStats;
  } catch (error) {
    console.error('Error updating DigiStats:', error);
    return null;
  }
}; 