import AsyncStorage from '@react-native-async-storage/async-storage';
import { deductDigicoins, addDigicoins } from './storage';
import adManager from './adManager';

const DRAW_DATA_KEY = 'drawData';
const USER_DRAW_DATA_KEY = 'userDrawData';
export const TICKET_COST = 1; // 1 Digicoin per ticket
export const AD_REWARD_TICKETS = 5; // 5 tickets per ad
const AD_COOLDOWN_MINUTES = 5; // 5 minutes between ads

export interface DrawEntry {
  id: string;
  title: string;
  description: string;
  prize: string;
  prizeValue: string;
  imageUrl?: string;
  startTime: Date;
  endTime: Date;
  totalTickets: number;
  maxTicketsPerUser?: number;
  isActive: boolean;
  category: 'tech' | 'gaming' | 'lifestyle' | 'premium';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface UserDrawData {
  ticketsOwned: number;
  totalSpent: number;
  lastAdWatch?: Date;
}

export interface DrawParticipation {
  [drawId: string]: UserDrawData;
}

// Predefined draws for different tech gadgets
const AVAILABLE_DRAWS: Omit<DrawEntry, 'startTime' | 'endTime' | 'isActive'>[] = [
  // LEGENDARY PRIZES (Ultra Premium)
  {
    id: 'macbook-m4-pro',
    title: 'MacBook M4 Pro',
    description: 'Latest MacBook Pro with M4 chip, 16GB RAM, 512GB SSD',
    prize: 'MacBook M4 Pro 14"',
    prizeValue: '$2,499',
    category: 'tech',
    rarity: 'legendary',
    totalTickets: 5000,
    maxTicketsPerUser: 100,
  },
  {
    id: 'tesla-model-3',
    title: 'Tesla Model 3',
    description: 'Electric vehicle with autopilot, premium interior, and supercharging',
    prize: 'Tesla Model 3 Standard Range',
    prizeValue: '$38,990',
    category: 'premium',
    rarity: 'legendary',
    totalTickets: 15000,
    maxTicketsPerUser: 200,
  },
  {
    id: 'rolex-submariner',
    title: 'Rolex Submariner',
    description: 'Iconic luxury dive watch with stainless steel case and bracelet',
    prize: 'Rolex Submariner Date',
    prizeValue: '$9,150',
    category: 'lifestyle',
    rarity: 'legendary',
    totalTickets: 8000,
    maxTicketsPerUser: 150,
  },

  // EPIC PRIZES (High-End)
  {
    id: 'iphone-16-pro',
    title: 'iPhone 16 Pro',
    description: 'Latest iPhone 16 Pro with 256GB storage in Natural Titanium',
    prize: 'iPhone 16 Pro 256GB',
    prizeValue: '$1,199',
    category: 'tech',
    rarity: 'epic',
    totalTickets: 3000,
    maxTicketsPerUser: 75,
  },
  {
    id: 'ipad-pro-m4',
    title: 'iPad Pro M4',
    description: '13-inch iPad Pro with M4 chip and Apple Pencil Pro',
    prize: 'iPad Pro 13" M4 + Apple Pencil Pro',
    prizeValue: '$1,599',
    category: 'tech',
    rarity: 'epic',
    totalTickets: 2500,
    maxTicketsPerUser: 60,
  },
  {
    id: 'ps5-pro',
    title: 'PlayStation 5 Pro',
    description: 'Next-gen gaming console with enhanced GPU and ray tracing',
    prize: 'PlayStation 5 Pro + 2 Controllers',
    prizeValue: '$799',
    category: 'gaming',
    rarity: 'epic',
    totalTickets: 2000,
    maxTicketsPerUser: 50,
  },
  {
    id: 'macbook-air-m3',
    title: 'MacBook Air M3',
    description: 'Lightweight laptop with M3 chip, perfect for students and professionals',
    prize: 'MacBook Air 13" M3',
    prizeValue: '$1,099',
    category: 'tech',
    rarity: 'epic',
    totalTickets: 2200,
    maxTicketsPerUser: 55,
  },
  {
    id: 'dyson-v15',
    title: 'Dyson V15 Detect',
    description: 'Cordless vacuum with laser dust detection and LCD screen',
    prize: 'Dyson V15 Detect Absolute',
    prizeValue: '$749',
    category: 'lifestyle',
    rarity: 'epic',
    totalTickets: 1800,
    maxTicketsPerUser: 45,
  },

  // RARE PRIZES (Quality)
  {
    id: 'airpods-max',
    title: 'AirPods Max',
    description: 'Premium over-ear headphones with spatial audio',
    prize: 'AirPods Max',
    prizeValue: '$549',
    category: 'tech',
    rarity: 'rare',
    totalTickets: 1500,
    maxTicketsPerUser: 50,
  },
  {
    id: 'apple-watch-ultra',
    title: 'Apple Watch Ultra 2',
    description: 'Rugged smartwatch with titanium case and Ocean Band',
    prize: 'Apple Watch Ultra 2',
    prizeValue: '$799',
    category: 'lifestyle',
    rarity: 'rare',
    totalTickets: 2000,
    maxTicketsPerUser: 40,
  },
  {
    id: 'samsung-galaxy-s24',
    title: 'Samsung Galaxy S24 Ultra',
    description: 'Flagship Android phone with S Pen and 200MP camera',
    prize: 'Samsung Galaxy S24 Ultra 256GB',
    prizeValue: '$1,299',
    category: 'tech',
    rarity: 'rare',
    totalTickets: 2600,
    maxTicketsPerUser: 65,
  },
  {
    id: 'xbox-series-x',
    title: 'Xbox Series X',
    description: 'Microsoft\'s most powerful gaming console with Game Pass Ultimate',
    prize: 'Xbox Series X + Game Pass (3 months)',
    prizeValue: '$549',
    category: 'gaming',
    rarity: 'rare',
    totalTickets: 1400,
    maxTicketsPerUser: 35,
  },
  {
    id: 'bose-qc45',
    title: 'Bose QuietComfort 45',
    description: 'World-class noise cancelling headphones with 24-hour battery',
    prize: 'Bose QuietComfort 45',
    prizeValue: '$329',
    category: 'tech',
    rarity: 'rare',
    totalTickets: 1000,
    maxTicketsPerUser: 30,
  },
  {
    id: 'gopro-hero12',
    title: 'GoPro HERO12 Black',
    description: 'Action camera with 5.3K video and HyperSmooth stabilization',
    prize: 'GoPro HERO12 Black + Accessories',
    prizeValue: '$499',
    category: 'lifestyle',
    rarity: 'rare',
    totalTickets: 1200,
    maxTicketsPerUser: 35,
  },

  // COMMON PRIZES (Everyday Tech)
  {
    id: 'nintendo-switch-oled',
    title: 'Nintendo Switch OLED',
    description: 'Gaming console with vibrant OLED screen and Joy-Con controllers',
    prize: 'Nintendo Switch OLED',
    prizeValue: '$349',
    category: 'gaming',
    rarity: 'common',
    totalTickets: 1000,
    maxTicketsPerUser: 30,
  },
  {
    id: 'airpods-pro-2',
    title: 'AirPods Pro (2nd Gen)',
    description: 'Wireless earbuds with active noise cancellation and spatial audio',
    prize: 'AirPods Pro (2nd Generation)',
    prizeValue: '$249',
    category: 'tech',
    rarity: 'common',
    totalTickets: 800,
    maxTicketsPerUser: 25,
  },
  {
    id: 'apple-watch-se',
    title: 'Apple Watch SE',
    description: 'Essential smartwatch features with fitness tracking and notifications',
    prize: 'Apple Watch SE (2nd Gen)',
    prizeValue: '$249',
    category: 'lifestyle',
    rarity: 'common',
    totalTickets: 800,
    maxTicketsPerUser: 25,
  },
  {
    id: 'kindle-oasis',
    title: 'Kindle Oasis',
    description: 'Premium e-reader with 7" display and adjustable warm light',
    prize: 'Kindle Oasis 32GB',
    prizeValue: '$279',
    category: 'lifestyle',
    rarity: 'common',
    totalTickets: 700,
    maxTicketsPerUser: 20,
  },
  {
    id: 'sony-wh1000xm5',
    title: 'Sony WH-1000XM5',
    description: 'Industry-leading noise canceling headphones with 30-hour battery',
    prize: 'Sony WH-1000XM5',
    prizeValue: '$399',
    category: 'tech',
    rarity: 'common',
    totalTickets: 1100,
    maxTicketsPerUser: 30,
  },
  {
    id: 'fitbit-sense-2',
    title: 'Fitbit Sense 2',
    description: 'Advanced health smartwatch with stress management and GPS',
    prize: 'Fitbit Sense 2',
    prizeValue: '$299',
    category: 'lifestyle',
    rarity: 'common',
    totalTickets: 900,
    maxTicketsPerUser: 25,
  },
];

// Get all active draws
export const getActiveDraws = async (): Promise<DrawEntry[]> => {
  try {
    const stored = await AsyncStorage.getItem(DRAW_DATA_KEY);
    const now = new Date();
    
    if (stored) {
      const draws = JSON.parse(stored);
      // Convert date strings back to Date objects and filter active
      return draws
        .map((draw: any) => ({
          ...draw,
          startTime: new Date(draw.startTime),
          endTime: new Date(draw.endTime),
        }))
        .filter((draw: DrawEntry) => draw.isActive && draw.endTime > now);
    }
    
    // Initialize with default draws if none exist
    const defaultDraws = await initializeDefaultDraws();
    return defaultDraws.filter(draw => draw.isActive);
  } catch (error) {
    console.error('Error getting active draws:', error);
    return [];
  }
};

// Get specific draw by ID
export const getDrawById = async (drawId: string): Promise<DrawEntry | null> => {
  try {
    const draws = await getActiveDraws();
    return draws.find(draw => draw.id === drawId) || null;
  } catch (error) {
    console.error('Error getting draw by ID:', error);
    return null;
  }
};

// Initialize default draws (for demo purposes)
const initializeDefaultDraws = async (): Promise<DrawEntry[]> => {
  const now = new Date();
  const draws: DrawEntry[] = AVAILABLE_DRAWS.map((drawTemplate, index) => ({
    ...drawTemplate,
    startTime: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Started yesterday
    endTime: new Date(now.getTime() + (7 + index) * 24 * 60 * 60 * 1000), // Ends in 7+ days
    isActive: true,
  }));
  
  await AsyncStorage.setItem(DRAW_DATA_KEY, JSON.stringify(draws));
  return draws;
};

// Get current main draw (for backward compatibility)
export const getCurrentDraw = async (): Promise<DrawEntry> => {
  const draws = await getActiveDraws();
  // Return the first legendary draw or the first available draw
  const mainDraw = draws.find(draw => draw.rarity === 'legendary') || draws[0];
  
  if (!mainDraw) {
    // Create a default draw if none exist
    const defaultDraws = await initializeDefaultDraws();
    return defaultDraws[0];
  }
  
  return mainDraw;
};

// Get user's draw data for a specific draw
export const getUserDrawData = async (drawId: string): Promise<UserDrawData> => {
  try {
    const stored = await AsyncStorage.getItem(USER_DRAW_DATA_KEY);
    
    if (stored) {
      const allUserData: DrawParticipation = JSON.parse(stored);
      const userData = allUserData[drawId];
      
      if (userData) {
        // Convert date string back to Date object
        return {
          ...userData,
          lastAdWatch: userData.lastAdWatch ? new Date(userData.lastAdWatch) : undefined,
        };
      }
    }
    
    // Return default data if none exists
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

// Update user's draw data for a specific draw
const updateUserDrawData = async (drawId: string, userData: UserDrawData): Promise<void> => {
  try {
    const stored = await AsyncStorage.getItem(USER_DRAW_DATA_KEY);
    let allUserData: DrawParticipation = {};
    
    if (stored) {
      allUserData = JSON.parse(stored);
    }
    
    allUserData[drawId] = userData;
    await AsyncStorage.setItem(USER_DRAW_DATA_KEY, JSON.stringify(allUserData));
  } catch (error) {
    console.error('Error updating user draw data:', error);
    throw error;
  }
};

// Purchase tickets for a specific draw
export const purchaseTickets = async (drawId: string, ticketCount: number): Promise<boolean> => {
  try {
    const draw = await getDrawById(drawId);
    if (!draw) {
      throw new Error('Draw not found');
    }
    
    const totalCost = ticketCount * TICKET_COST;
    const userData = await getUserDrawData(drawId);
    
    // Check if user would exceed max tickets
    if (draw.maxTicketsPerUser && userData.ticketsOwned + ticketCount > draw.maxTicketsPerUser) {
      throw new Error(`Maximum ${draw.maxTicketsPerUser} tickets allowed per user for this draw`);
    }
    
    // Deduct Digicoins
    const success = await deductDigicoins(totalCost);
    if (!success) {
      return false;
    }
    
    // Update user data
    const newUserData: UserDrawData = {
      ...userData,
      ticketsOwned: userData.ticketsOwned + ticketCount,
      totalSpent: userData.totalSpent + totalCost,
    };
    
    await updateUserDrawData(drawId, newUserData);
    return true;
  } catch (error) {
    console.error('Error purchasing tickets:', error);
    return false;
  }
};

// Add free tickets from watching ads  
export const addFreeTicketsFromAd = async (drawId: string): Promise<{ success: boolean; ticketsEarned: number; error?: string }> => {
  try {
    // Check if user can watch ad (cooldown)
    const canWatch = await canWatchAdForTickets(drawId);
    if (!canWatch) {
      return {
        success: false,
        ticketsEarned: 0,
        error: `Please wait ${AD_COOLDOWN_MINUTES} minutes between ads.`
      };
    }

    // Show rewarded ad
    console.log('🎯 DrawManager: Attempting to show rewarded ad for tickets...');
    const adResult = await adManager.showRewardedAd();
    console.log('🎯 DrawManager: Ad result:', adResult);
    
    if (!adResult.success) {
      console.log('❌ DrawManager: Ad failed or was skipped, no tickets awarded');
      return {
        success: false,
        ticketsEarned: 0,
        error: 'Ad was skipped or failed to load. Please try again.'
      };
    }
    
    console.log('✅ DrawManager: Ad was successfully watched, awarding tickets');

    // Ad was watched successfully, add tickets
    const draw = await getDrawById(drawId);
    if (!draw) {
      throw new Error('Draw not found');
    }
    
    const userData = await getUserDrawData(drawId);
    const ticketsToAdd = AD_REWARD_TICKETS;
    
    // Check if user would exceed max tickets
    if (draw.maxTicketsPerUser && userData.ticketsOwned + ticketsToAdd > draw.maxTicketsPerUser) {
      const allowedTickets = draw.maxTicketsPerUser - userData.ticketsOwned;
      if (allowedTickets <= 0) {
        return {
          success: false,
          ticketsEarned: 0,
          error: `You've reached the maximum number of tickets (${draw.maxTicketsPerUser}) for this draw.`
        };
      }
      // Only add up to the maximum allowed
      const newUserData: UserDrawData = {
        ...userData,
        ticketsOwned: draw.maxTicketsPerUser,
        lastAdWatch: new Date(),
      };
      await updateUserDrawData(drawId, newUserData);
      return {
        success: true,
        ticketsEarned: allowedTickets
      };
    }
    
    // Update user data
    const newUserData: UserDrawData = {
      ...userData,
      ticketsOwned: userData.ticketsOwned + ticketsToAdd,
      lastAdWatch: new Date(),
    };
    
    await updateUserDrawData(drawId, newUserData);
    return {
      success: true,
      ticketsEarned: ticketsToAdd
    };
  } catch (error) {
    console.error('Error adding free tickets from ad:', error);
    return {
      success: false,
      ticketsEarned: 0,
      error: 'An unexpected error occurred. Please try again.'
    };
  }
};

// Add free tickets from watching ads (legacy function)
export const addFreeTickets = async (drawId: string, watchedAd: boolean = false): Promise<number> => {
  try {
    const draw = await getDrawById(drawId);
    if (!draw) {
      throw new Error('Draw not found');
    }
    
    const userData = await getUserDrawData(drawId);
    const ticketsToAdd = watchedAd ? AD_REWARD_TICKETS : 0;
    
    // Check if user would exceed max tickets
    if (draw.maxTicketsPerUser && userData.ticketsOwned + ticketsToAdd > draw.maxTicketsPerUser) {
      const allowedTickets = draw.maxTicketsPerUser - userData.ticketsOwned;
      if (allowedTickets <= 0) {
        return 0;
      }
      // Only add up to the maximum allowed
      const newUserData: UserDrawData = {
        ...userData,
        ticketsOwned: draw.maxTicketsPerUser,
        lastAdWatch: watchedAd ? new Date() : userData.lastAdWatch,
      };
      await updateUserDrawData(drawId, newUserData);
      return allowedTickets;
    }
    
    // Update user data
    const newUserData: UserDrawData = {
      ...userData,
      ticketsOwned: userData.ticketsOwned + ticketsToAdd,
      lastAdWatch: watchedAd ? new Date() : userData.lastAdWatch,
    };
    
    await updateUserDrawData(drawId, newUserData);
    return ticketsToAdd;
  } catch (error) {
    console.error('Error adding free tickets:', error);
    return 0;
  }
};

// Check if user can watch ad for tickets
export const canWatchAdForTickets = async (drawId: string): Promise<boolean> => {
  try {
    const userData = await getUserDrawData(drawId);
    
    // If user has never watched an ad, they can watch
    if (!userData.lastAdWatch) {
      return true;
    }
    
    // Check cooldown (5 minutes between ads)
    const now = new Date();
    const lastWatch = new Date(userData.lastAdWatch);
    const timeDiff = now.getTime() - lastWatch.getTime();
    const minutesSinceLastAd = Math.floor(timeDiff / (1000 * 60));
    
    return minutesSinceLastAd >= AD_COOLDOWN_MINUTES;
  } catch (error) {
    console.error('Error checking ad eligibility:', error);
    return false;
  }
};

// Get remaining cooldown time in minutes
export const getAdCooldownRemaining = async (drawId: string): Promise<number> => {
  try {
    const userData = await getUserDrawData(drawId);
    
    // If user has never watched an ad, no cooldown
    if (!userData.lastAdWatch) {
      return 0;
    }
    
    // Calculate remaining cooldown time
    const now = new Date();
    const lastWatch = new Date(userData.lastAdWatch);
    const timeDiff = now.getTime() - lastWatch.getTime();
    const minutesSinceLastAd = Math.floor(timeDiff / (1000 * 60));
    
    return Math.max(0, AD_COOLDOWN_MINUTES - minutesSinceLastAd);
  } catch (error) {
    console.error('Error getting ad cooldown:', error);
    return 0;
  }
};

// Get time remaining for a draw
export const getTimeRemaining = (endTime: Date): string => {
  const now = new Date();
  const timeDiff = endTime.getTime() - now.getTime();
  
  if (timeDiff <= 0) {
    return 'Draw ended';
  }
  
  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};

// Get rarity color for UI
export const getRarityColor = (rarity: DrawEntry['rarity']): string => {
  switch (rarity) {
    case 'common': return '#4CAF50';
    case 'rare': return '#2196F3';
    case 'epic': return '#9C27B0';
    case 'legendary': return '#FFD700';
    default: return '#757575';
  }
};

// Get category icon
export const getCategoryIcon = (category: DrawEntry['category']): string => {
  switch (category) {
    case 'tech': return 'laptop-outline';
    case 'gaming': return 'game-controller-outline';
    case 'lifestyle': return 'watch-outline';
    case 'premium': return 'diamond-outline';
    default: return 'gift-outline';
  }
}; 