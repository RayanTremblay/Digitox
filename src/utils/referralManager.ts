import AsyncStorage from '@react-native-async-storage/async-storage';
import { addDetoxcoins, getDetoxcoinsBalance } from './storage';

const REFERRAL_REWARD = 20; // 20 Detoxcoins per successful referral

export interface ReferralData {
  userId: string;
  referralCode: string;
  invitesSent: number;
  successfulReferrals: number;
  totalEarned: number;
  inviteHistory: InviteRecord[];
}

export interface InviteRecord {
  id: string;
  method: 'message' | 'messenger' | 'snapchat' | 'whatsapp' | 'email' | 'copy';
  timestamp: Date;
  referralCode: string;
  status: 'sent' | 'pending' | 'completed';
}

// Generate a unique referral code for the user
export const generateReferralCode = (): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'DGX';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Get or create user's referral data
export const getUserReferralData = async (): Promise<ReferralData> => {
  try {
    const stored = await AsyncStorage.getItem('userReferralData');
    if (stored) {
      const data = JSON.parse(stored);
      // Convert date strings back to Date objects
      data.inviteHistory = data.inviteHistory.map((invite: any) => ({
        ...invite,
        timestamp: new Date(invite.timestamp)
      }));
      return data;
    }
    
    // Create new referral data for first-time user
    const newReferralData: ReferralData = {
      userId: generateUserId(),
      referralCode: generateReferralCode(),
      invitesSent: 0,
      successfulReferrals: 0,
      totalEarned: 0,
      inviteHistory: [],
    };
    
    await AsyncStorage.setItem('userReferralData', JSON.stringify(newReferralData));
    return newReferralData;
  } catch (error) {
    console.error('Error getting referral data:', error);
    throw error;
  }
};

// Generate a simple user ID (in a real app, this would come from authentication)
const generateUserId = (): string => {
  return 'user_' + Math.random().toString(36).substr(2, 9);
};

// Generate referral link with user ID for automatic tracking
export const generateReferralLink = (userId: string): string => {
  // Since the app isn't published yet, generate a placeholder link
  // In production, this would be your actual app store links with deep linking
  const baseUrl = 'https://detoxly.app/invite';
  return `${baseUrl}?referrer=${userId}&utm_source=referral&utm_medium=social`;
};

// Generate share message with referral link
export const generateShareMessage = (userId: string, userName?: string): string => {
  const link = generateReferralLink(userId);
  const personalizedMessage = userName 
    ? `Hey! ${userName} invited you to try Detoxly - `
    : 'Hey! I thought you might like Detoxly - ';
    
  return `${personalizedMessage}a digital wellness app that helps you reduce screen time and earn rewards!

Click my link to download and I'll get bonus Detoxcoins when you join:

${link}

Let's build healthier digital habits together!`;
};

// Record an invite being sent
export const recordInviteSent = async (method: InviteRecord['method']): Promise<string> => {
  try {
    const referralData = await getUserReferralData();
    
    const inviteRecord: InviteRecord = {
      id: Date.now().toString(),
      method,
      timestamp: new Date(),
      referralCode: referralData.referralCode,
      status: 'sent',
    };
    
    referralData.invitesSent += 1;
    referralData.inviteHistory.push(inviteRecord);
    
    await AsyncStorage.setItem('userReferralData', JSON.stringify(referralData));
    
    return referralData.userId; // Return userId instead of referralCode
  } catch (error) {
    console.error('Error recording invite:', error);
    throw error;
  }
};

// Simulate a successful referral (in real app, this would be triggered when someone clicks the link)
export const processSuccessfulReferral = async (userId?: string): Promise<boolean> => {
  try {
    const referralData = await getUserReferralData();
    
    // If userId is provided, check if it matches (for specific user testing)
    // In production, this would be triggered automatically when someone clicks the link
    if (userId && referralData.userId !== userId) {
      return false; // Not this user's referral
    }
    
    // Award the referral bonus automatically
    await addDetoxcoins(REFERRAL_REWARD);
    
    // Update referral data
    referralData.successfulReferrals += 1;
    referralData.totalEarned += REFERRAL_REWARD;
    
    // Update invite history to mark as completed
    const pendingInvites = referralData.inviteHistory.filter(invite => invite.status === 'sent');
    if (pendingInvites.length > 0) {
      pendingInvites[0].status = 'completed';
    }
    
    await AsyncStorage.setItem('userReferralData', JSON.stringify(referralData));
    
    return true;
  } catch (error) {
    console.error('Error processing referral:', error);
    return false;
  }
};

// Get referral stats for display
export const getReferralStats = async () => {
  try {
    const referralData = await getUserReferralData();
    const currentBalance = await getDetoxcoinsBalance();
    
    return {
      userId: referralData.userId,
      referralCode: referralData.referralCode, // Keep for display purposes
      invitesSent: referralData.invitesSent,
      successfulReferrals: referralData.successfulReferrals,
      totalEarned: referralData.totalEarned,
      currentBalance,
      rewardPerReferral: REFERRAL_REWARD,
    };
  } catch (error) {
    console.error('Error getting referral stats:', error);
    return {
      userId: '',
      referralCode: '',
      invitesSent: 0,
      successfulReferrals: 0,
      totalEarned: 0,
      currentBalance: 0,
      rewardPerReferral: REFERRAL_REWARD,
    };
  }
};

// For testing purposes - simulate friend clicking link
export const simulateLinkClick = async (): Promise<boolean> => {
  try {
    const referralData = await getUserReferralData();
    const success = await processSuccessfulReferral(referralData.userId);
    return success;
  } catch (error) {
    console.error('Error simulating link click:', error);
    return false;
  }
};

export { REFERRAL_REWARD }; 