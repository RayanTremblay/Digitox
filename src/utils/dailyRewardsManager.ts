import AsyncStorage from '@react-native-async-storage/async-storage';
import { addDetoxcoins } from './storage';
import adManager from './adManager';

const DAILY_REWARDS_KEY = 'dailyRewardsData';
const MAX_DAILY_CLAIMS = 3;

export interface DailyRewardsData {
  date: string; // YYYY-MM-DD format
  claimsToday: number;
  totalClaimed: number;
  totalEarned: number;
  lastClaimTime?: Date;
  claimHistory: DailyClaimRecord[];
}

export interface DailyClaimRecord {
  id: string;
  timestamp: Date;
  reward: number;
  date: string;
}

// Weighted probability distribution for rewards (0-100)
// Higher numbers have exponentially lower chances
const REWARD_WEIGHTS = [
  // 0-10: Very common (50% total chance)
  { min: 0, max: 10, weight: 500 },
  // 11-25: Common (25% total chance)
  { min: 11, max: 25, weight: 166 },
  // 26-50: Uncommon (15% total chance)
  { min: 26, max: 50, weight: 60 },
  // 51-75: Rare (7% total chance)
  { min: 51, max: 75, weight: 28 },
  // 76-90: Very rare (2.5% total chance)
  { min: 76, max: 90, weight: 16 },
  // 91-100: Ultra rare (0.5% total chance)
  { min: 91, max: 100, weight: 5 },
];

// Get today's date in YYYY-MM-DD format
const getTodayString = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// Get or create daily rewards data
export const getDailyRewardsData = async (): Promise<DailyRewardsData> => {
  try {
    const stored = await AsyncStorage.getItem(DAILY_REWARDS_KEY);
    const today = getTodayString();
    
    if (stored) {
      const data = JSON.parse(stored);
      
      // Convert date strings back to Date objects
      if (data.lastClaimTime) {
        data.lastClaimTime = new Date(data.lastClaimTime);
      }
      data.claimHistory = data.claimHistory.map((claim: any) => ({
        ...claim,
        timestamp: new Date(claim.timestamp)
      }));
      
      // Reset daily claims if it's a new day
      if (data.date !== today) {
        data.date = today;
        data.claimsToday = 0;
      }
      
      return data;
    }
    
    // Create new daily rewards data
    const newData: DailyRewardsData = {
      date: today,
      claimsToday: 0,
      totalClaimed: 0,
      totalEarned: 0,
      claimHistory: [],
    };
    
    await AsyncStorage.setItem(DAILY_REWARDS_KEY, JSON.stringify(newData));
    return newData;
  } catch (error) {
    console.error('Error getting daily rewards data:', error);
    throw error;
  }
};

// Generate random reward based on weighted probabilities
const generateRandomReward = (): number => {
  // Calculate total weight
  const totalWeight = REWARD_WEIGHTS.reduce((sum, tier) => sum + tier.weight, 0);
  
  // Generate random number within total weight
  let random = Math.random() * totalWeight;
  
  // Find which tier the random number falls into
  for (const tier of REWARD_WEIGHTS) {
    if (random <= tier.weight) {
      // Generate random number within the tier's range
      return Math.floor(Math.random() * (tier.max - tier.min + 1)) + tier.min;
    }
    random -= tier.weight;
  }
  
  // Fallback (should never reach here)
  return Math.floor(Math.random() * 11); // 0-10
};

// Check if user can claim daily reward
export const canClaimDailyReward = async (): Promise<boolean> => {
  try {
    const data = await getDailyRewardsData();
    return data.claimsToday < MAX_DAILY_CLAIMS;
  } catch (error) {
    console.error('Error checking daily reward eligibility:', error);
    return false;
  }
};

// Get remaining claims for today
export const getRemainingClaims = async (): Promise<number> => {
  try {
    const data = await getDailyRewardsData();
    return Math.max(0, MAX_DAILY_CLAIMS - data.claimsToday);
  } catch (error) {
    console.error('Error getting remaining claims:', error);
    return 0;
  }
};

// Process daily reward claim (watch ad + get reward)
export const claimDailyReward = async (): Promise<{ success: boolean; reward?: number; error?: string }> => {
  try {
    // Check if user can claim
    const canClaim = await canClaimDailyReward();
    if (!canClaim) {
      return { 
        success: false, 
        error: 'No more daily rewards available today. Come back tomorrow!' 
      };
    }
    
    // Show ad first
    const adResult = await adManager.showRewardedAd();
    if (!adResult.success) {
      return { 
        success: false, 
        error: 'Ad was skipped or failed to load. Please try again.' 
      };
    }
    
    // Generate random reward
    const rewardAmount = generateRandomReward();
    
    // Add Detoxcoins to user's balance
    await addDetoxcoins(rewardAmount);
    
    // Update daily rewards data
    const data = await getDailyRewardsData();
    data.claimsToday += 1;
    data.totalClaimed += 1;
    data.totalEarned += rewardAmount;
    data.lastClaimTime = new Date();
    
    // Add to claim history
    const claimRecord: DailyClaimRecord = {
      id: Date.now().toString(),
      timestamp: new Date(),
      reward: rewardAmount,
      date: data.date,
    };
    data.claimHistory.push(claimRecord);
    
    // Keep only last 30 days of history
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    data.claimHistory = data.claimHistory.filter(
      claim => claim.timestamp >= thirtyDaysAgo
    );
    
    await AsyncStorage.setItem(DAILY_REWARDS_KEY, JSON.stringify(data));
    
    return { success: true, reward: rewardAmount };
  } catch (error) {
    console.error('Error claiming daily reward:', error);
    return { 
      success: false, 
      error: 'An unexpected error occurred. Please try again.' 
    };
  }
};

// Get daily rewards stats for display
export const getDailyRewardsStats = async () => {
  try {
    const data = await getDailyRewardsData();
    
    return {
      claimsToday: data.claimsToday,
      maxClaims: MAX_DAILY_CLAIMS,
      remainingClaims: Math.max(0, MAX_DAILY_CLAIMS - data.claimsToday),
      totalClaimed: data.totalClaimed,
      totalEarned: data.totalEarned,
      lastClaimTime: data.lastClaimTime,
      canClaim: data.claimsToday < MAX_DAILY_CLAIMS,
    };
  } catch (error) {
    console.error('Error getting daily rewards stats:', error);
    return {
      claimsToday: 0,
      maxClaims: MAX_DAILY_CLAIMS,
      remainingClaims: MAX_DAILY_CLAIMS,
      totalClaimed: 0,
      totalEarned: 0,
      lastClaimTime: undefined,
      canClaim: true,
    };
  }
};

// Get recent claim history
export const getRecentClaims = async (limit: number = 10): Promise<DailyClaimRecord[]> => {
  try {
    const data = await getDailyRewardsData();
    return data.claimHistory
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting recent claims:', error);
    return [];
  }
};

// Get probability information for UI display
export const getRewardProbabilities = () => {
  const totalWeight = REWARD_WEIGHTS.reduce((sum, tier) => sum + tier.weight, 0);
  
  return REWARD_WEIGHTS.map(tier => ({
    range: `${tier.min}-${tier.max}`,
    probability: ((tier.weight / totalWeight) * 100).toFixed(1) + '%',
    rarity: tier.min <= 10 ? 'Common' : 
            tier.min <= 25 ? 'Uncommon' : 
            tier.min <= 50 ? 'Rare' : 
            tier.min <= 75 ? 'Very Rare' : 
            tier.min <= 90 ? 'Epic' : 'Legendary'
  }));
};

export { MAX_DAILY_CLAIMS }; 