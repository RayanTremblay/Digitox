import { getDigicoinsBalance, deductDigicoins, addDigicoins } from './storage';
import { ScratchReward } from '../components/ScratchCard';

const SCRATCH_CARD_COST = 5;

export const purchaseScratchCard = async (): Promise<boolean> => {
  try {
    const currentBalance = await getDigicoinsBalance();
    
    if (currentBalance < SCRATCH_CARD_COST) {
      return false; // Insufficient balance
    }
    
    const success = await deductDigicoins(SCRATCH_CARD_COST);
    return success;
  } catch (error) {
    console.error('Error purchasing scratch card:', error);
    return false;
  }
};

export const processReward = async (reward: ScratchReward): Promise<boolean> => {
  try {
    if (reward.type === 'digicoin') {
      // Add Digicoins to balance
      await addDigicoins(reward.amount);
      return true;
    } else if (reward.type === 'amazon') {
      // For Amazon gift cards, we would typically:
      // 1. Generate a unique gift card code
      // 2. Send it to user's email
      // 3. Store the transaction in database
      // For now, we'll just log it
      console.log(`Amazon gift card won: $${reward.amount}`);
      
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
      digicoin: 99.933, // 99.933% chance (1499 out of 1500)
      amazon: 0.067,    // 0.067% chance (1 out of 1500)
    },
    digicoinsRange: [1, 2, 3, 5, 8, 10],
    amazonRange: [5, 10, 15, 20],
  };
}; 