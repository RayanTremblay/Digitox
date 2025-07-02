import { Alert } from 'react-native';

// Ad Manager for handling rewarded ads
// This is a mock implementation - in production you would integrate with
// real ad networks like AdMob, Facebook Audience Network, etc.

export interface AdReward {
  type: 'currency';
  amount: number;
}

class AdManager {
  private isAdLoaded: boolean = false;
  private isLoadingAd: boolean = false;

  // Initialize ad manager
  async initialize(): Promise<boolean> {
    try {
      // In production, initialize your ad SDK here
      console.log('🎬 Ad Manager: Initializing...');
      
      // Simulate initialization delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('✅ Ad Manager: Initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Ad Manager: Failed to initialize', error);
      return false;
    }
  }

  // Load a rewarded ad
  async loadRewardedAd(): Promise<boolean> {
    if (this.isLoadingAd || this.isAdLoaded) {
      return this.isAdLoaded;
    }

    try {
      this.isLoadingAd = true;
      console.log('🎬 Ad Manager: Loading rewarded ad...');
      
      // Simulate ad loading (in production, load real ad here)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate 90% success rate for ad loading
      const loadSuccess = Math.random() > 0.1;
      
      if (loadSuccess) {
        this.isAdLoaded = true;
        console.log('✅ Ad Manager: Rewarded ad loaded successfully');
      } else {
        console.log('❌ Ad Manager: Failed to load rewarded ad');
      }
      
      return loadSuccess;
    } catch (error) {
      console.error('❌ Ad Manager: Error loading rewarded ad', error);
      return false;
    } finally {
      this.isLoadingAd = false;
    }
  }

  // Show rewarded ad
  async showRewardedAd(): Promise<{ success: boolean; reward?: AdReward }> {
    if (!this.isAdLoaded) {
      console.log('⚠️ Ad Manager: No ad loaded, attempting to load...');
      const loaded = await this.loadRewardedAd();
      if (!loaded) {
        return { success: false };
      }
    }

    try {
      console.log('🎬 Ad Manager: Showing rewarded ad...');
      
      // In production, show real ad here
      // For demo purposes, we'll simulate ad viewing
      const watchResult = await this.simulateAdWatching();
      
      if (watchResult.watched) {
        this.isAdLoaded = false; // Ad consumed
        console.log('✅ Ad Manager: User watched ad, reward granted');
        
        return {
          success: true,
          reward: {
            type: 'currency',
            amount: 1 // 1 scratch card earned
          }
        };
      } else {
        console.log('⚠️ Ad Manager: User skipped or closed ad');
        return { success: false };
      }
    } catch (error) {
      console.error('❌ Ad Manager: Error showing rewarded ad', error);
      return { success: false };
    }
  }

  // Simulate ad watching experience
  private async simulateAdWatching(): Promise<{ watched: boolean }> {
    return new Promise((resolve) => {
      Alert.alert(
        '🎬 Watch Ad',
        'Watch a short video to earn a free scratch card!',
        [
          {
            text: 'Skip',
            style: 'cancel',
            onPress: () => resolve({ watched: false })
          },
          {
            text: 'Watch Ad',
            onPress: () => {
              // Simulate 5-second ad viewing
              setTimeout(() => {
                Alert.alert(
                  '✅ Ad Complete!',
                  'Thanks for watching! You earned a free scratch card.',
                  [{ text: 'OK', onPress: () => resolve({ watched: true }) }]
                );
              }, 2000); // Simulate 2-second ad
            }
          }
        ]
      );
    });
  }

  // Check if ad is available
  isAdAvailable(): boolean {
    return this.isAdLoaded;
  }

  // Preload ad for better UX
  async preloadAd(): Promise<void> {
    if (!this.isAdLoaded && !this.isLoadingAd) {
      await this.loadRewardedAd();
    }
  }
}

// Export singleton instance
export const adManager = new AdManager();

// Initialize ad manager when module loads
adManager.initialize().then((success) => {
  if (success) {
    // Preload first ad
    adManager.preloadAd();
  }
});

export default adManager; 