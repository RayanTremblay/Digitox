import { getDigicoinsBalance, deductDigicoins, addDigicoins } from './storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TICKET_COST = 1; // 1 Digicoin per ticket
const AD_REWARD_TICKETS = 5; // 5 tickets per ad watched

export interface DrawEntry {
  id: string;
  userTickets: number;
  totalTickets: number;
  prize: string;
  endTime: Date;
  isActive: boolean;
}

export interface UserDrawData {
  ticketsOwned: number;
  totalSpent: number;
  lastAdWatched?: Date;
}

// Get current active draw
export const getCurrentDraw = async (): Promise<DrawEntry> => {
  try {
    const stored = await AsyncStorage.getItem('currentDraw');
    if (stored) {
      const draw = JSON.parse(stored);
      // Convert endTime back to Date object
      draw.endTime = new Date(draw.endTime);
      return draw;
    }
    
    // Create default draw if none exists
    const defaultDraw: DrawEntry = {
      id: 'macbook-m4-pro-2025',
      userTickets: 0,
      totalTickets: 1000, // Total tickets available
      prize: 'Macbook M4 Pro',
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      isActive: true,
    };
    
    await AsyncStorage.setItem('currentDraw', JSON.stringify(defaultDraw));
    return defaultDraw;
  } catch (error) {
    console.error('Error getting current draw:', error);
    throw error;
  }
};

// Get user's draw data
export const getUserDrawData = async (drawId: string): Promise<UserDrawData> => {
  try {
    const stored = await AsyncStorage.getItem(`userDraw_${drawId}`);
    if (stored) {
      const data = JSON.parse(stored);
      // Convert lastAdWatched back to Date if it exists
      if (data.lastAdWatched) {
        data.lastAdWatched = new Date(data.lastAdWatched);
      }
      return data;
    }
    
    return {
      ticketsOwned: 0,
      totalSpent: 0,
    };
  } catch (error) {
    console.error('Error getting user draw data:', error);
    return {
      ticketsOwned: 0,
      totalSpent: 0,
    };
  }
};

// Purchase tickets with Digicoins
export const purchaseTickets = async (drawId: string, ticketCount: number): Promise<boolean> => {
  try {
    const totalCost = ticketCount * TICKET_COST;
    const currentBalance = await getDigicoinsBalance();
    
    if (currentBalance < totalCost) {
      return false; // Insufficient balance
    }
    
    // Deduct Digicoins
    const deductSuccess = await deductDigicoins(totalCost);
    if (!deductSuccess) {
      return false;
    }
    
    // Update user's draw data
    const userData = await getUserDrawData(drawId);
    userData.ticketsOwned += ticketCount;
    userData.totalSpent += totalCost;
    
    await AsyncStorage.setItem(`userDraw_${drawId}`, JSON.stringify(userData));
    
    // Update draw's total tickets
    const draw = await getCurrentDraw();
    draw.userTickets += ticketCount;
    await AsyncStorage.setItem('currentDraw', JSON.stringify(draw));
    
    return true;
  } catch (error) {
    console.error('Error purchasing tickets:', error);
    return false;
  }
};

// Add free tickets from watching ads
export const addFreeTickets = async (drawId: string, adWatched: boolean = true): Promise<number> => {
  try {
    if (!adWatched) {
      return 0;
    }
    
    // Update user's draw data
    const userData = await getUserDrawData(drawId);
    userData.ticketsOwned += AD_REWARD_TICKETS;
    userData.lastAdWatched = new Date();
    
    await AsyncStorage.setItem(`userDraw_${drawId}`, JSON.stringify(userData));
    
    // Update draw's total tickets
    const draw = await getCurrentDraw();
    draw.userTickets += AD_REWARD_TICKETS;
    await AsyncStorage.setItem('currentDraw', JSON.stringify(draw));
    
    return AD_REWARD_TICKETS;
  } catch (error) {
    console.error('Error adding free tickets:', error);
    return 0;
  }
};

// Calculate time remaining for draw
export const getTimeRemaining = (endTime: Date): string => {
  const now = new Date();
  const difference = endTime.getTime() - now.getTime();
  
  if (difference <= 0) {
    return 'Ended';
  }
  
  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((difference % (1000 * 60)) / 1000);
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else {
    return `${minutes}m ${seconds}s`;
  }
};

// Get draw statistics
export const getDrawStats = () => {
  return {
    ticketCost: TICKET_COST,
    adRewardTickets: AD_REWARD_TICKETS,
  };
};

// Check if user can watch ad for tickets (prevent spam)
export const canWatchAdForTickets = async (drawId: string): Promise<boolean> => {
  try {
    const userData = await getUserDrawData(drawId);
    
    if (!userData.lastAdWatched) {
      return true; // Never watched an ad for this draw
    }
    
    // Allow watching ad every 5 minutes to prevent spam
    const timeSinceLastAd = Date.now() - userData.lastAdWatched.getTime();
    const fiveMinutes = 5 * 60 * 1000;
    
    return timeSinceLastAd >= fiveMinutes;
  } catch (error) {
    console.error('Error checking ad eligibility:', error);
    return true; // Default to allowing ad
  }
};

export { TICKET_COST, AD_REWARD_TICKETS }; 