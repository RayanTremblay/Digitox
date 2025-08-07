import { Alert } from 'react-native';
import { 
  RewardedAd, 
  RewardedAdEventType, 
  TestIds,
  AdEventType
} from 'react-native-google-mobile-ads';

// AdMob ad unit IDs
const AD_UNIT_IDS = {
  // Use test ads in development, real ads in production
  REWARDED: __DEV__ ? TestIds.REWARDED : 'ca-app-pub-3131985902128037/7113058829',
};

export interface AdReward {
  type: 'currency';
  amount: number;
}

class AdManager {
  private rewardedAd: RewardedAd | null = null;
  private isAdLoaded: boolean = false;
  private isLoadingAd: boolean = false;
  private isInitialized: boolean = false;

  // Initialize ad manager
  async initialize(): Promise<boolean> {
    try {
      console.log('Ad Manager: Initializing...');
      
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
    if (!this.rewardedAd) return;

    this.rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
      console.log('Rewarded ad loaded');
      this.isAdLoaded = true;
      this.isLoadingAd = false;
    });

    this.rewardedAd.addAdEventListener(AdEventType.ERROR, (error) => {
      console.error('Rewarded ad error:', error);
      this.isAdLoaded = false;
      this.isLoadingAd = false;
    });

    this.rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
      console.log('User earned reward:', reward);
    });
  }

  // Load a rewarded ad
  async loadRewardedAd(): Promise<boolean> {
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
    if (!this.isInitialized) {
      console.log('Ad Manager: SDK not initialized, cannot show ads');
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
      
      // Create a promise that will resolve when the ad is properly shown
      const adShowPromise = new Promise<boolean>((resolve, reject) => {
        let adShown = false;
        let timeout: NodeJS.Timeout;
        
        const cleanup = () => {
          if (timeout) clearTimeout(timeout);
        };
        
        // Set up temporary event listeners to track ad completion
        const handleAdDismissed = () => {
          cleanup();
          console.log('Ad Manager: Ad was properly dismissed after being watched');
          adShown = true;
          resolve(true);
        };
        
        const handleAdFailedToShow = (error: any) => {
          cleanup();
          console.log('Ad Manager: Ad failed to show:', error);
          reject(error);
        };
        
        // Add listeners
        this.rewardedAd!.addAdEventListener(RewardedAdEventType.EARNED_REWARD, handleAdDismissed);
        this.rewardedAd!.addAdEventListener(AdEventType.ERROR, handleAdFailedToShow);
        
        // Timeout after 10 seconds if ad doesn't respond
        timeout = setTimeout(() => {
          cleanup();
          if (!adShown) {
            console.log('Ad Manager: Ad show timeout - no response after 10 seconds');
            reject(new Error('Ad show timeout'));
          }
        }, 10000);
        
        // Try to show the ad
        this.rewardedAd!.show().catch(reject);
      });
      
      // Wait for the ad to be properly shown and watched
      await adShowPromise;
      
      // Reset ad state
      this.isAdLoaded = false;
      
      // Create new ad instance for next time
      this.rewardedAd = RewardedAd.createForAdRequest(AD_UNIT_IDS.REWARDED);
      this.setupAdEventListeners();
      
      console.log('Ad Manager: User watched ad, reward granted');
      
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