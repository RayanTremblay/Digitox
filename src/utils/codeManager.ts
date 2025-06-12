import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys for the code management system
const AVAILABLE_CODES_KEY = '@digitox_available_codes';
const ASSIGNED_CODES_KEY = '@digitox_assigned_codes';
const USER_CODES_KEY = '@digitox_user_codes';

// Interface for the code database entry
export interface PromoCodeEntry {
  id: string;
  code: string;
  createdAt: string;
}

// Interface for assigned code
export interface AssignedPromoCode {
  id: string;
  userId: string;
  code: string;
  offerId: string;
  assignedAt: string;
  expiresAt: string;
  isUsed: boolean;
}

// Interface for user's unique code per offer
export interface UserPromoCode {
  userId: string;
  offerId: string;
  code: string;
  assignedAt: string;
  expiresAt: string;
  isUsed: boolean;
}

/**
 * Your specific promo codes - Add your codes here
 */
const YOUR_PROMO_CODES = [
  'DIGI34',
  'FREO2',
  'LPOS4',
  'DIGI56',
  'FREO7',
  'LPOS9',
  'DIGI78',
  'FREO12',
  'LPOS15',
  'DIGI90',
  'DIGI45',
  'FREO8',
  'LPOS12',
  'DIGI67',
  'FREO15',
  'LPOS18',
  'DIGI89',
  'FREO20',
  'LPOS25',
  'DIGI123'
];

/**
 * Auto-initialize with your promo codes on first app launch
 */
export const autoInitializeYourCodes = async (): Promise<boolean> => {
  try {
    // Check if codes are already initialized
    const existingCodes = await getAvailableCodes();
    const assignedCodes = await getAssignedCodes();
    
    if (existingCodes.length > 0 || assignedCodes.length > 0) {
      console.log('Promo codes already initialized');
      return true;
    }

    // Initialize with your codes
    console.log('Auto-initializing with your promo codes...');
    const success = await initializeCodeDatabase(YOUR_PROMO_CODES);
    
    if (success) {
      console.log(`Successfully initialized with ${YOUR_PROMO_CODES.length} promo codes`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error auto-initializing codes:', error);
    return false;
  }
};

/**
 * Initialize the code database with your provided codes
 * This should be called once when you want to populate the database
 */
export const initializeCodeDatabase = async (codes: string[]): Promise<boolean> => {
  try {
    const promoEntries: PromoCodeEntry[] = codes.map((code, index) => ({
      id: `code_${index}_${Date.now()}`,
      code: code.trim().toUpperCase(),
      createdAt: new Date().toISOString()
    }));

    await AsyncStorage.setItem(AVAILABLE_CODES_KEY, JSON.stringify(promoEntries));
    console.log(`Initialized code database with ${codes.length} codes`);
    return true;
  } catch (error) {
    console.error('Error initializing code database:', error);
    return false;
  }
};

/**
 * Add new codes to the existing database
 */
export const addCodesToDatabase = async (newCodes: string[]): Promise<boolean> => {
  try {
    const existingCodes = await getAvailableCodes();
    const existingCodeValues = existingCodes.map(c => c.code);
    
    // Filter out duplicates
    const uniqueNewCodes = newCodes.filter(code => 
      !existingCodeValues.includes(code.trim().toUpperCase())
    );

    const newEntries: PromoCodeEntry[] = uniqueNewCodes.map((code, index) => ({
      id: `code_${existingCodes.length + index}_${Date.now()}`,
      code: code.trim().toUpperCase(),
      createdAt: new Date().toISOString()
    }));

    const updatedCodes = [...existingCodes, ...newEntries];
    await AsyncStorage.setItem(AVAILABLE_CODES_KEY, JSON.stringify(updatedCodes));
    
    console.log(`Added ${uniqueNewCodes.length} new codes to database`);
    return true;
  } catch (error) {
    console.error('Error adding codes to database:', error);
    return false;
  }
};

/**
 * Get all available codes from the database
 */
export const getAvailableCodes = async (): Promise<PromoCodeEntry[]> => {
  try {
    const codes = await AsyncStorage.getItem(AVAILABLE_CODES_KEY);
    return codes ? JSON.parse(codes) : [];
  } catch (error) {
    console.error('Error getting available codes:', error);
    return [];
  }
};

/**
 * Get the number of available codes
 */
export const getAvailableCodesCount = async (): Promise<number> => {
  try {
    const codes = await getAvailableCodes();
    return codes.length;
  } catch (error) {
    console.error('Error getting available codes count:', error);
    return 0;
  }
};

/**
 * Check if a user already has a promo code assigned for a specific offer
 */
export const getUserPromoCodeForOffer = async (userId: string, offerId: string): Promise<UserPromoCode | null> => {
  try {
    const userCode = await AsyncStorage.getItem(`${USER_CODES_KEY}_${userId}_${offerId}`);
    return userCode ? JSON.parse(userCode) : null;
  } catch (error) {
    console.error('Error getting user promo code for offer:', error);
    return null;
  }
};

/**
 * Get all promo codes for a user across all offers
 */
export const getAllUserPromoCodes = async (userId: string): Promise<UserPromoCode[]> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const userCodeKeys = keys.filter(key => key.startsWith(`${USER_CODES_KEY}_${userId}_`));
    
    if (userCodeKeys.length === 0) {
      return [];
    }
    
    const userCodes = await AsyncStorage.multiGet(userCodeKeys);
    return userCodes
      .filter(([, value]) => value !== null)
      .map(([, value]) => JSON.parse(value!));
  } catch (error) {
    console.error('Error getting all user promo codes:', error);
    return [];
  }
};

/**
 * Assign a unique promo code to a user when they redeem an offer
 * Each user can only have one unique promo code
 */
export const assignPromoCodeToUser = async (
  userId: string, 
  offerId: string,
  expiresAt?: string
): Promise<UserPromoCode | null> => {
  try {
    // Check if user already has a promo code for this specific offer
    const existingUserCode = await getUserPromoCodeForOffer(userId, offerId);
    if (existingUserCode) {
      console.log(`User ${userId} already has a promo code for offer ${offerId}: ${existingUserCode.code}`);
      return existingUserCode;
    }

    // Get available codes
    const availableCodes = await getAvailableCodes();
    
    if (availableCodes.length === 0) {
      console.error('No available promo codes in database');
      return null;
    }

    // Get the first available code
    const selectedCode = availableCodes[0];
    
    // Remove the selected code from available codes
    const remainingCodes = availableCodes.slice(1);
    await AsyncStorage.setItem(AVAILABLE_CODES_KEY, JSON.stringify(remainingCodes));

    // Create user's promo code
    const userPromoCode: UserPromoCode = {
      userId,
      offerId,
      code: selectedCode.code,
      assignedAt: new Date().toISOString(),
      expiresAt: expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days default
      isUsed: false
    };

    // Store the user's promo code for this specific offer
    await AsyncStorage.setItem(`${USER_CODES_KEY}_${userId}_${offerId}`, JSON.stringify(userPromoCode));

    // Store in assigned codes for tracking
    const assignedCode: AssignedPromoCode = {
      id: selectedCode.id,
      userId,
      code: selectedCode.code,
      offerId,
      assignedAt: userPromoCode.assignedAt,
      expiresAt: userPromoCode.expiresAt,
      isUsed: false
    };

    const assignedCodes = await getAssignedCodes();
    assignedCodes.push(assignedCode);
    await AsyncStorage.setItem(ASSIGNED_CODES_KEY, JSON.stringify(assignedCodes));

    console.log(`Assigned promo code ${selectedCode.code} to user ${userId} for offer ${offerId}`);
    return userPromoCode;
  } catch (error) {
    console.error('Error assigning promo code to user:', error);
    return null;
  }
};

/**
 * Mark a user's promo code as used
 */
export const markUserPromoCodeAsUsed = async (userId: string, offerId: string): Promise<boolean> => {
  try {
    const userCode = await getUserPromoCodeForOffer(userId, offerId);
    if (!userCode) {
      return false;
    }

    // Update user's code
    const updatedUserCode = { ...userCode, isUsed: true };
    await AsyncStorage.setItem(`${USER_CODES_KEY}_${userId}_${offerId}`, JSON.stringify(updatedUserCode));

    // Update assigned codes
    const assignedCodes = await getAssignedCodes();
    const updatedAssignedCodes = assignedCodes.map(code => 
      code.userId === userId && code.offerId === offerId ? { ...code, isUsed: true } : code
    );
    await AsyncStorage.setItem(ASSIGNED_CODES_KEY, JSON.stringify(updatedAssignedCodes));

    return true;
  } catch (error) {
    console.error('Error marking user promo code as used:', error);
    return false;
  }
};

/**
 * Get all assigned codes (for admin/tracking purposes)
 */
export const getAssignedCodes = async (): Promise<AssignedPromoCode[]> => {
  try {
    const codes = await AsyncStorage.getItem(ASSIGNED_CODES_KEY);
    return codes ? JSON.parse(codes) : [];
  } catch (error) {
    console.error('Error getting assigned codes:', error);
    return [];
  }
};

/**
 * Get statistics about the code database
 */
export const getCodeDatabaseStats = async (): Promise<{
  availableCount: number;
  assignedCount: number;
  usedCount: number;
}> => {
  try {
    const availableCodes = await getAvailableCodes();
    const assignedCodes = await getAssignedCodes();
    const usedCodes = assignedCodes.filter(code => code.isUsed);

    return {
      availableCount: availableCodes.length,
      assignedCount: assignedCodes.length,
      usedCount: usedCodes.length
    };
  } catch (error) {
    console.error('Error getting code database stats:', error);
    return {
      availableCount: 0,
      assignedCount: 0,
      usedCount: 0
    };
  }
};

/**
 * Clear all code data (for testing/reset purposes)
 */
export const clearAllCodeData = async (): Promise<boolean> => {
  try {
    await AsyncStorage.multiRemove([
      AVAILABLE_CODES_KEY,
      ASSIGNED_CODES_KEY
    ]);

    // Also clear individual user codes
    const keys = await AsyncStorage.getAllKeys();
    const userCodeKeys = keys.filter(key => key.startsWith(USER_CODES_KEY));
    if (userCodeKeys.length > 0) {
      await AsyncStorage.multiRemove(userCodeKeys);
    }

    console.log('Cleared all code data');
    return true;
  } catch (error) {
    console.error('Error clearing code data:', error);
    return false;
  }
}; 