import { Alert } from 'react-native';

// Conditionally import Google Mobile Ads to avoid errors when not available
let RewardedAd: any = null;
let RewardedAdEventType: any = null;
let TestIds: any = null;
let AdEventType: any = null;

try {
  const mobileAds = require('react-native-google-mobile-ads');
  RewardedAd = mobileAds.RewardedAd;
  RewardedAdEventType = mobileAds.RewardedAdEventType;
  TestIds = mobileAds.TestIds;
  AdEventType = mobileAds.AdEventType;
} catch (error) {
  console.warn('Google Mobile Ads not available in adManager:', (error as Error).message);
}

// AdMob ad unit IDs
const AD_UNIT_IDS = {
  // Use test ads in development, real ads in production
  REWARDED: __DEV__ ? (TestIds?.REWARDED || 'test-rewarded-ad-unit-id') : 'ca-app-pub-3131985902128037/7113058829',
};

export interface AdReward {
  type: 'currency';
  amount: number;
}

class AdManager {
  private rewardedAd: any = null;
  private isAdLoaded: boolean = false;
  private isLoadingAd: boolean = false;
  private isInitialized: boolean = false;

  // Initialize ad manager
  async initialize(): Promise<boolean> {
    try {
      console.log('Ad Manager: Initializing...');
      
      // Check if Google Mobile Ads is available
      if (!RewardedAd) {
        console.log('Ad Manager: Google Mobile Ads not available, skipping initialization');
        this.isInitialized = false;
        return false;
      }
      
      // Create rewarded ad instance
      this.rewardedAd = RewardedAd.createForAdRequest(AD_UNIT_IDS.REWARDED);
      
      // Set up event listeners
      this.setupAdEventListeners();
      
      this.isInitialized = true;
      console.log('Ad Manager: Initialized successfully');
      return true;
    } catch (error) {
      console.error('Ad Manager: Failed to initialize', error);
      this.isInitialized = false;
      return false;
    }
  }

  private setupAdEventListeners(): void {
    if (!this.rewardedAd || !RewardedAdEventType || !AdEventType) return;

    this.rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
      console.log('Rewarded ad loaded');
      this.isAdLoaded = true;
      this.isLoadingAd = false;
    });

    this.rewardedAd.addAdEventListener(AdEventType.ERROR, (error: any) => {
      console.error('Rewarded ad error:', error);
      this.isAdLoaded = false;
      this.isLoadingAd = false;
    });

    this.rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward: any) => {
      console.log('User earned reward:', reward);
    });
  }

  // Load a rewarded ad
  async loadRewardedAd(): Promise<boolean> {
    if (!this.isInitialized || !RewardedAd) {
      console.log('Ad Manager: Google Mobile Ads not available, cannot load ads');
      return false;
    }

    if (this.isLoadingAd || this.isAdLoaded || !this.rewardedAd) {
      return this.isAdLoaded;
    }

    try {
      this.isLoadingAd = true;
      console.log('🔄 Loading rewarded ad...');
      
      await this.rewardedAd.load();
      return true;
    } catch (error) {
      this.isLoadingAd = false;
      console.error('Error loading rewarded ad:', error);
      return false;
    }
  }

  // Show rewarded ad
  async showRewardedAd(): Promise<{ success: boolean; reward?: AdReward }> {
    console.log('Ad Manager: showRewardedAd() called');
    console.log('📊 Ad Manager: Current state - isAdLoaded:', this.isAdLoaded, 'rewardedAd exists:', !!this.rewardedAd);
    
    // STRICT: Check if SDK is properly initialized first
    if (!this.isInitialized || !RewardedAd) {
      console.log('Ad Manager: SDK not initialized or Google Mobile Ads not available, cannot show ads');
      return { success: false };
    }
    
    if (!this.isAdLoaded || !this.rewardedAd) {
      console.log('Ad Manager: No ad loaded, attempting to load...');
      const loaded = await this.loadRewardedAd();
      console.log('📥 Ad Manager: Load attempt result:', loaded);
      if (!loaded) {
        console.log('Ad Manager: Failed to load ad, returning failure');
        return { success: false };
      }
    }

    try {
      console.log('Ad Manager: Attempting to show rewarded ad...');
      console.log('Ad Manager: Ad Unit ID:', AD_UNIT_IDS.REWARDED);
      
      // Create a promise that will resolve when the ad is properly shown and completed
      const adShowPromise = new Promise<boolean>((resolve, reject) => {
        let adCompleted = false;
        let rewardEarned = false;
        let timeout: NodeJS.Timeout;
        
        const cleanup = () => {
          if (timeout) clearTimeout(timeout);
        };
        
        // Set up temporary event listeners to track ad completion
        const handleRewardEarned = () => {
          console.log('Ad Manager: User earned reward');
          rewardEarned = true;
        };
        
        const handleAdClosed = () => {
          console.log('Ad Manager: Ad was closed');
          cleanup();
          if (!adCompleted) {
            adCompleted = true;
            resolve(rewardEarned);
          }
        };
        
        const handleAdFailedToShow = (error: any) => {
          console.log('Ad Manager: Ad failed to show:', error);
          cleanup();
          if (!adCompleted) {
            adCompleted = true;
            reject(error);
          }
        };
        
        // Add listeners
        this.rewardedAd!.addAdEventListener(RewardedAdEventType.EARNED_REWARD, handleRewardEarned);
        this.rewardedAd!.addAdEventListener(AdEventType.CLOSED, handleAdClosed);
        this.rewardedAd!.addAdEventListener(AdEventType.ERROR, handleAdFailedToShow);
        
        // Set a reasonable timeout (30 seconds) to prevent hanging
        timeout = setTimeout(() => {
          cleanup();
          if (!adCompleted) {
            console.log('Ad Manager: Ad show timeout after 30 seconds');
            adCompleted = true;
            resolve(rewardEarned);
          }
        }, 30000);
        
        // Try to show the ad
        this.rewardedAd!.show().catch((error: any) => {
          cleanup();
          if (!adCompleted) {
            adCompleted = true;
            reject(error);
          }
        });
      });
      
      // Wait for the ad to be properly shown and dismissed
      const rewardEarned = await adShowPromise;
      
      // Reset ad state
      this.isAdLoaded = false;
      
      // Create new ad instance for next time
      this.rewardedAd = RewardedAd.createForAdRequest(AD_UNIT_IDS.REWARDED);
      this.setupAdEventListeners();
      
      console.log('Ad Manager: Ad completed, reward earned:', rewardEarned);
      
      // Preload next ad
      setTimeout(() => this.preloadAd(), 1000);
      
      return {
        success: true,
        reward: {
          type: 'currency',
          amount: 1 // 1 scratch card earned
        }
      };
    } catch (error) {
      console.error('Ad Manager: Error showing rewarded ad', error);
      console.error('Ad Manager: Error details:', JSON.stringify(error));
      this.isAdLoaded = false; // Reset state on error
      return { success: false };
    }
  }

  // Check if ad is available
  isAdAvailable(): boolean {
    return this.isAdLoaded && this.rewardedAd !== null;
  }

  // Check if currently loading an ad
  isLoading(): boolean {
    return this.isLoadingAd;
  }

  // Get ad availability status
  getAdStatus(): 'ready' | 'loading' | 'not_available' {
    if (this.isAdLoaded) return 'ready';
    if (this.isLoadingAd) return 'loading';
    return 'not_available';
  }

  // Preload ad for better UX
  async preloadAd(): Promise<void> {
    if (!this.isAdLoaded && !this.isLoadingAd) {
      await this.loadRewardedAd();
    }
  }

  // Check if ad manager is properly initialized
  getInitializationStatus(): boolean {
    return this.isInitialized;
  }
}

// Export singleton instance
export const adManager = new AdManager();

// Initialize ad manager after a small delay to ensure Google Mobile Ads SDK is ready
setTimeout(() => {
  adManager.initialize().then((success) => {
    if (success) {
      // Preload first ad
      adManager.preloadAd();
    }
  });
}, 1000); // 1 second delay

export default adManager;