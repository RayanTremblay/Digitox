import { getDetoxcoinsBalance, deductDetoxcoins, addDetoxcoins } from './storage';
import { ScratchReward } from '../components/ScratchCard';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SCRATCH_CARD_COST = 5;

export const purchaseScratchCard = async (): Promise<boolean> => {
  try {
    const currentBalance = await getDetoxcoinsBalance();
    
    if (currentBalance < SCRATCH_CARD_COST) {
      return false; // Insufficient balance
    }
    
    const success = await deductDetoxcoins(SCRATCH_CARD_COST);
    return success;
  } catch (error) {
    console.error('Error purchasing scratch card:', error);
    return false;
  }
};

// Gift card win tracking
interface GiftCardWin {
  id: string;
  userId?: string;
  email?: string;
  amount: number;
  timestamp: Date;
  status: 'pending' | 'sent' | 'failed';
  notes?: string;
}

const GIFT_CARD_WINS_KEY = '@detoxly_gift_card_wins';

// Store gift card win for manual processing
export const logGiftCardWin = async (reward: ScratchReward, userInfo?: { userId?: string; email?: string }): Promise<boolean> => {
  try {
    const winRecord: GiftCardWin = {
      id: Date.now().toString(),
      userId: userInfo?.userId || 'unknown', 
      email: userInfo?.email || 'unknown',  
      amount: reward.amount,
      timestamp: new Date(),
      status: 'pending',
      notes: `$${reward.amount} Amazon Gift Card won via scratch card`
    };

    // Get existing wins
    const existingWinsStr = await AsyncStorage.getItem(GIFT_CARD_WINS_KEY);
    const existingWins: GiftCardWin[] = existingWinsStr ? JSON.parse(existingWinsStr) : [];
    
    // Add new win
    existingWins.push(winRecord);
    
    // Store updated wins
    await AsyncStorage.setItem(GIFT_CARD_WINS_KEY, JSON.stringify(existingWins));
    
    console.log(`🎁 GIFT CARD WIN LOGGED: $${reward.amount} - ID: ${winRecord.id}`);
    return true;
  } catch (error) {
    console.error('Error logging gift card win:', error);
    return false;
  }
};

// Get all gift card wins for admin view
export const getGiftCardWins = async (): Promise<GiftCardWin[]> => {
  try {
    const winsStr = await AsyncStorage.getItem(GIFT_CARD_WINS_KEY);
    return winsStr ? JSON.parse(winsStr) : [];
  } catch (error) {
    console.error('Error getting gift card wins:', error);
    return [];
  }
};

// Update gift card win status
export const updateGiftCardWinStatus = async (winId: string, status: 'pending' | 'sent' | 'failed', notes?: string): Promise<boolean> => {
  try {
    const winsStr = await AsyncStorage.getItem(GIFT_CARD_WINS_KEY);
    const wins: GiftCardWin[] = winsStr ? JSON.parse(winsStr) : [];
    
    const winIndex = wins.findIndex(win => win.id === winId);
    if (winIndex !== -1) {
      wins[winIndex].status = status;
      if (notes) wins[winIndex].notes = notes;
      
      await AsyncStorage.setItem(GIFT_CARD_WINS_KEY, JSON.stringify(wins));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error updating gift card win status:', error);
    return false;
  }
};

export const processReward = async (reward: ScratchReward, userInfo?: { userId?: string; email?: string }): Promise<boolean> => {
  try {
    if (reward.type === 'detoxcoin') {
      // Add Detoxcoins to balance
      await addDetoxcoins(reward.amount);
      return true;
    } else if (reward.type === 'amazon') {
      // 🎁 LOG GIFT CARD WIN FOR MANUAL PROCESSING
      await logGiftCardWin(reward, userInfo);
      
      // For Amazon gift cards, we would typically:
      // 1. Generate a unique gift card code
      // 2. Send it to user's email
      // 3. Store the transaction in database
      // For now, we log it for manual processing
      console.log(`🎁 Amazon gift card won: $${reward.amount} - User: ${userInfo?.email || 'unknown'} - Check Admin Screen!`);
      
      // You could integrate with a gift card API here
      // await sendGiftCardToEmail(userEmail, reward.amount);
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error processing reward:', error);
    return false;
  }
};

export const getScratchCardCost = (): number => {
  return SCRATCH_CARD_COST;
};

// Statistics for tracking (updated odds)
export const getScratchCardStats = () => {
  return {
    cost: SCRATCH_CARD_COST,
    odds: {
      detoxcoin: 99.967, // 99.967% chance (2999 out of 3000)
      amazon: 0.033,    // 0.033% chance (1 out of 3000)
    },
    detoxcoinsRange: [1, 2, 3, 5, 8, 10],
    amazonRange: [5, 10, 15, 20],
  };
}; 