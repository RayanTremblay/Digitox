import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDigiStats } from '../utils/storage';
import notificationService from './notificationService';

const ACHIEVEMENTS_KEY = '@digitox_achievements';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string; // Ionicons name
  category: 'time' | 'streak' | 'balance' | 'sessions' | 'milestones' | 'special';
  criteria: {
    type: 'totalTime' | 'dailyStreak' | 'balance' | 'sessionCount' | 'singleSession' | 'totalEarned' | 'special';
    target: number;
    unit?: string;
  };
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  reward?: {
    digicoins: number;
    title: string;
  };
  unlocked: boolean;
  unlockedAt?: Date;
  progress: number; // 0-100
}

export interface AchievementStats {
  totalUnlocked: number;
  totalPossible: number;
  recentUnlocks: Achievement[];
  nextToUnlock: Achievement[];
  completionPercentage: number;
}

// Define all achievements
const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, 'unlocked' | 'unlockedAt' | 'progress'>[] = [
  // Time-based achievements
  {
    id: 'first_steps',
    title: 'First Steps',
    description: 'Complete your first 15-minute detox session',
    icon: 'walk',
    category: 'time',
    criteria: { type: 'singleSession', target: 15 },
    rarity: 'common',
    reward: { digicoins: 10, title: 'Welcome bonus!' }
  },
  {
    id: 'focused_hour',
    title: 'Focused Hour',
    description: 'Complete a 1-hour detox session',
    icon: 'time',
    category: 'time',
    criteria: { type: 'singleSession', target: 60 },
    rarity: 'common',
    reward: { digicoins: 25, title: 'Deep focus achieved!' }
  },
  {
    id: 'digital_monk',
    title: 'Digital Monk',
    description: 'Complete a 4-hour detox session',
    icon: 'flower',
    category: 'time',
    criteria: { type: 'singleSession', target: 240 },
    rarity: 'epic',
    reward: { digicoins: 100, title: 'Incredible self-control!' }
  },
  {
    id: 'time_traveler',
    title: 'Time Traveler',
    description: 'Accumulate 10 hours of total detox time',
    icon: 'hourglass',
    category: 'time',
    criteria: { type: 'totalTime', target: 600, unit: 'minutes' },
    rarity: 'rare',
    reward: { digicoins: 50, title: 'Time master!' }
  },
  {
    id: 'century_club',
    title: 'Century Club',
    description: 'Accumulate 100 hours of total detox time',
    icon: 'trophy',
    category: 'time',
    criteria: { type: 'totalTime', target: 6000, unit: 'minutes' },
    rarity: 'legendary',
    reward: { digicoins: 500, title: 'Digital wellness master!' }
  },

  // Streak-based achievements
  {
    id: 'consistency_start',
    title: 'Consistency Starter',
    description: 'Maintain a 3-day streak',
    icon: 'calendar',
    category: 'streak',
    criteria: { type: 'dailyStreak', target: 3 },
    rarity: 'common',
    reward: { digicoins: 15, title: 'Building habits!' }
  },
  {
    id: 'week_warrior',
    title: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: 'flame',
    category: 'streak',
    criteria: { type: 'dailyStreak', target: 7 },
    rarity: 'rare',
    reward: { digicoins: 50, title: 'One week strong!' }
  },
  {
    id: 'month_master',
    title: 'Month Master',
    description: 'Maintain a 30-day streak',
    icon: 'medal',
    category: 'streak',
    criteria: { type: 'dailyStreak', target: 30 },
    rarity: 'epic',
    reward: { digicoins: 200, title: 'Unstoppable dedication!' }
  },
  {
    id: 'streak_legend',
    title: 'Streak Legend',
    description: 'Maintain a 100-day streak',
    icon: 'star',
    category: 'streak',
    criteria: { type: 'dailyStreak', target: 100 },
    rarity: 'legendary',
    reward: { digicoins: 1000, title: 'Legendary commitment!' }
  },

  // Balance & earnings achievements
  {
    id: 'first_coins',
    title: 'First Coins',
    description: 'Earn your first 10 Digicoins',
    icon: 'diamond',
    category: 'balance',
    criteria: { type: 'totalEarned', target: 10 },
    rarity: 'common',
    reward: { digicoins: 5, title: 'Your journey begins!' }
  },
  {
    id: 'coin_collector',
    title: 'Coin Collector',
    description: 'Earn 100 Digicoins total',
    icon: 'cash',
    category: 'balance',
    criteria: { type: 'totalEarned', target: 100 },
    rarity: 'rare',
    reward: { digicoins: 25, title: 'Nice collection!' }
  },
  {
    id: 'digital_millionaire',
    title: 'Digital Millionaire',
    description: 'Earn 1000 Digicoins total',
    icon: 'sparkles',
    category: 'balance',
    criteria: { type: 'totalEarned', target: 1000 },
    rarity: 'legendary',
    reward: { digicoins: 100, title: 'Incredible dedication!' }
  },
  {
    id: 'wealthy_detoxer',
    title: 'Wealthy Detoxer',
    description: 'Have 500 Digicoins in your balance',
    icon: 'wallet',
    category: 'balance',
    criteria: { type: 'balance', target: 500 },
    rarity: 'epic',
    reward: { digicoins: 50, title: 'Financial discipline!' }
  },

  // Session-based achievements
  {
    id: 'session_starter',
    title: 'Session Starter',
    description: 'Complete 5 detox sessions',
    icon: 'play',
    category: 'sessions',
    criteria: { type: 'sessionCount', target: 5 },
    rarity: 'common',
    reward: { digicoins: 20, title: 'Getting into the habit!' }
  },
  {
    id: 'session_veteran',
    title: 'Session Veteran',
    description: 'Complete 50 detox sessions',
    icon: 'checkmark-circle',
    category: 'sessions',
    criteria: { type: 'sessionCount', target: 50 },
    rarity: 'rare',
    reward: { digicoins: 75, title: 'Experienced practitioner!' }
  },
  {
    id: 'session_master',
    title: 'Session Master',
    description: 'Complete 200 detox sessions',
    icon: 'ribbon',
    category: 'sessions',
    criteria: { type: 'sessionCount', target: 200 },
    rarity: 'epic',
    reward: { digicoins: 200, title: 'Master of detox!' }
  },

  // Milestone achievements
  {
    id: 'early_bird',
    title: 'Early Bird',
    description: 'Complete a detox session before 8 AM',
    icon: 'sunny',
    category: 'milestones',
    criteria: { type: 'special', target: 1 },
    rarity: 'rare',
    reward: { digicoins: 30, title: 'Morning motivation!' }
  },
  {
    id: 'night_owl',
    title: 'Night Owl',
    description: 'Complete a detox session after 10 PM',
    icon: 'moon',
    category: 'milestones',
    criteria: { type: 'special', target: 1 },
    rarity: 'rare',
    reward: { digicoins: 30, title: 'Evening focus!' }
  },
  {
    id: 'weekend_warrior',
    title: 'Weekend Warrior',
    description: 'Complete detox sessions on both Saturday and Sunday',
    icon: 'calendar-number',
    category: 'milestones',
    criteria: { type: 'special', target: 1 },
    rarity: 'epic',
    reward: { digicoins: 40, title: 'Weekend dedication!' }
  },

  // Special achievements
  {
    id: 'perfect_week',
    title: 'Perfect Week',
    description: 'Complete at least one detox session every day for a week',
    icon: 'star-outline',
    category: 'special',
    criteria: { type: 'special', target: 1 },
    rarity: 'epic',
    reward: { digicoins: 100, title: 'Flawless consistency!' }
  },
  {
    id: 'marathon_detoxer',
    title: 'Marathon Detoxer',
    description: 'Complete a detox session longer than 8 hours',
    icon: 'fitness',
    category: 'special',
    criteria: { type: 'singleSession', target: 480 },
    rarity: 'legendary',
    reward: { digicoins: 300, title: 'Extraordinary endurance!' }
  }
];

class AchievementService {
  private static instance: AchievementService;
  private achievements: Achievement[] = [];
  private sessionCount: number = 0;

  static getInstance(): AchievementService {
    if (!AchievementService.instance) {
      AchievementService.instance = new AchievementService();
    }
    return AchievementService.instance;
  }

  /**
   * Initialize achievement system
   */
  async initialize(): Promise<void> {
    try {
      await this.loadAchievements();
      await this.loadSessionCount();
      console.log('🏆 Achievement system initialized');
    } catch (error) {
      console.error('❌ Failed to initialize achievement system:', error);
    }
  }

  /**
   * Load achievements from storage
   */
  private async loadAchievements(): Promise<void> {
    try {
      const saved = await AsyncStorage.getItem(ACHIEVEMENTS_KEY);
      
      if (saved) {
        const savedAchievements = JSON.parse(saved) as Achievement[];
        
        // Merge with definitions to add any new achievements
        this.achievements = ACHIEVEMENT_DEFINITIONS.map(def => {
          const existing = savedAchievements.find(a => a.id === def.id);
          return existing || {
            ...def,
            unlocked: false,
            progress: 0
          };
        });
      } else {
        // Initialize with all achievements locked
        this.achievements = ACHIEVEMENT_DEFINITIONS.map(def => ({
          ...def,
          unlocked: false,
          progress: 0
        }));
      }

      await this.saveAchievements();
    } catch (error) {
      console.error('Error loading achievements:', error);
      this.achievements = [];
    }
  }

  /**
   * Save achievements to storage
   */
  private async saveAchievements(): Promise<void> {
    try {
      await AsyncStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(this.achievements));
    } catch (error) {
      console.error('Error saving achievements:', error);
    }
  }

  /**
   * Load session count from storage
   */
  private async loadSessionCount(): Promise<void> {
    try {
      const count = await AsyncStorage.getItem('@digitox_session_count');
      this.sessionCount = count ? parseInt(count, 10) : 0;
    } catch (error) {
      console.error('Error loading session count:', error);
      this.sessionCount = 0;
    }
  }

  /**
   * Increment session count
   */
  private async incrementSessionCount(): Promise<void> {
    try {
      this.sessionCount += 1;
      await AsyncStorage.setItem('@digitox_session_count', this.sessionCount.toString());
    } catch (error) {
      console.error('Error incrementing session count:', error);
    }
  }

  /**
   * Check for newly unlocked achievements
   */
  async checkAchievements(): Promise<Achievement[]> {
    try {
      const stats = await getDigiStats();
      const newlyUnlocked: Achievement[] = [];

      for (const achievement of this.achievements) {
        if (achievement.unlocked) continue;

        const wasUnlocked = this.checkSingleAchievement(achievement, stats);
        if (wasUnlocked) {
          achievement.unlocked = true;
          achievement.unlockedAt = new Date();
          achievement.progress = 100;
          newlyUnlocked.push(achievement);

          // Award coins if achievement has reward
          if (achievement.reward) {
            await this.awardAchievementReward(achievement);
          }

          // Send notification
          await this.sendAchievementNotification(achievement);
        } else {
          // Update progress
          achievement.progress = this.calculateProgress(achievement, stats);
        }
      }

      if (newlyUnlocked.length > 0) {
        await this.saveAchievements();
        console.log(`🏆 ${newlyUnlocked.length} new achievements unlocked!`);
      }

      return newlyUnlocked;
    } catch (error) {
      console.error('Error checking achievements:', error);
      return [];
    }
  }

  /**
   * Check a specific achievement
   */
  private checkSingleAchievement(achievement: Achievement, stats: any): boolean {
    const { criteria } = achievement;

    switch (criteria.type) {
      case 'totalTime':
        return stats.totalTimeSaved >= criteria.target;
      
      case 'dailyStreak':
        return stats.currentStreak >= criteria.target;
      
      case 'balance':
        return stats.balance >= criteria.target;
      
      case 'totalEarned':
        return stats.totalEarned >= criteria.target;
      
      case 'sessionCount':
        return this.sessionCount >= criteria.target;
      
      case 'singleSession':
        // This will be checked separately when a session completes
        return false;
      
      case 'special':
        // Special achievements need custom logic
        return this.checkSpecialAchievement(achievement.id);
      
      default:
        return false;
    }
  }

  /**
   * Calculate progress percentage for an achievement
   */
  private calculateProgress(achievement: Achievement, stats: any): number {
    const { criteria } = achievement;
    let current = 0;

    switch (criteria.type) {
      case 'totalTime':
        current = stats.totalTimeSaved;
        break;
      case 'dailyStreak':
        current = stats.currentStreak;
        break;
      case 'balance':
        current = stats.balance;
        break;
      case 'totalEarned':
        current = stats.totalEarned;
        break;
      case 'sessionCount':
        current = this.sessionCount;
        break;
      default:
        return 0;
    }

    return Math.min(100, Math.round((current / criteria.target) * 100));
  }

  /**
   * Check special achievements that need custom logic
   */
  private checkSpecialAchievement(achievementId: string): boolean {
    // These would be set by specific events in the app
    // For now, return false - will implement specific logic later
    return false;
  }

  /**
   * Check session-based achievements
   */
  async checkSessionAchievements(sessionDurationMinutes: number): Promise<Achievement[]> {
    try {
      await this.incrementSessionCount();
      const newlyUnlocked: Achievement[] = [];

      // Check single session achievements
      for (const achievement of this.achievements) {
        if (achievement.unlocked || achievement.criteria.type !== 'singleSession') continue;

        if (sessionDurationMinutes >= achievement.criteria.target) {
          achievement.unlocked = true;
          achievement.unlockedAt = new Date();
          achievement.progress = 100;
          newlyUnlocked.push(achievement);

          if (achievement.reward) {
            await this.awardAchievementReward(achievement);
          }

          await this.sendAchievementNotification(achievement);
        }
      }

      // Check regular achievements
      const regularUnlocks = await this.checkAchievements();
      newlyUnlocked.push(...regularUnlocks);

      return newlyUnlocked;
    } catch (error) {
      console.error('Error checking session achievements:', error);
      return [];
    }
  }

  /**
   * Award achievement reward
   */
  private async awardAchievementReward(achievement: Achievement): Promise<void> {
    if (!achievement.reward) return;

    try {
      // Add coins to balance (implement this in your storage utils)
      const { addDigicoins } = await import('../utils/storage');
      await addDigicoins(achievement.reward.digicoins);
      
      console.log(`💰 Awarded ${achievement.reward.digicoins} Digicoins for "${achievement.title}"`);
    } catch (error) {
      console.error('Error awarding achievement reward:', error);
    }
  }

  /**
   * Send achievement notification
   */
  private async sendAchievementNotification(achievement: Achievement): Promise<void> {
    try {
      const rarity = achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1);
      const rewardText = achievement.reward ? ` (+${achievement.reward.digicoins} Digicoins)` : '';
      
      // This would use your notification service
      console.log(`🏆 Achievement Unlocked: ${achievement.title}${rewardText}`);
      
      // You can integrate with your notification service here
      // await notificationService.sendImmediateEncouragement();
    } catch (error) {
      console.error('Error sending achievement notification:', error);
    }
  }

  /**
   * Get all achievements
   */
  getAchievements(): Achievement[] {
    return [...this.achievements];
  }

  /**
   * Get achievements by category
   */
  getAchievementsByCategory(category: Achievement['category']): Achievement[] {
    return this.achievements.filter(a => a.category === category);
  }

  /**
   * Get unlocked achievements
   */
  getUnlockedAchievements(): Achievement[] {
    return this.achievements.filter(a => a.unlocked);
  }

  /**
   * Get locked achievements
   */
  getLockedAchievements(): Achievement[] {
    return this.achievements.filter(a => !a.unlocked);
  }

  /**
   * Get achievements close to unlocking (>70% progress)
   */
  getAlmostUnlockedAchievements(): Achievement[] {
    return this.achievements.filter(a => !a.unlocked && a.progress >= 70);
  }

  /**
   * Get achievement statistics
   */
  getAchievementStats(): AchievementStats {
    const unlocked = this.getUnlockedAchievements();
    const almostUnlocked = this.getAlmostUnlockedAchievements();
    
    // Sort recent unlocks by date
    const recentUnlocks = unlocked
      .filter(a => a.unlockedAt)
      .sort((a, b) => (b.unlockedAt!.getTime() - a.unlockedAt!.getTime()))
      .slice(0, 5);

    return {
      totalUnlocked: unlocked.length,
      totalPossible: this.achievements.length,
      recentUnlocks,
      nextToUnlock: almostUnlocked.slice(0, 3),
      completionPercentage: Math.round((unlocked.length / this.achievements.length) * 100)
    };
  }

  /**
   * Get achievement by ID
   */
  getAchievement(id: string): Achievement | undefined {
    return this.achievements.find(a => a.id === id);
  }

  /**
   * Mark special achievement as completed
   */
  async unlockSpecialAchievement(achievementId: string): Promise<boolean> {
    try {
      const achievement = this.achievements.find(a => a.id === achievementId);
      if (!achievement || achievement.unlocked) return false;

      achievement.unlocked = true;
      achievement.unlockedAt = new Date();
      achievement.progress = 100;

      if (achievement.reward) {
        await this.awardAchievementReward(achievement);
      }

      await this.sendAchievementNotification(achievement);
      await this.saveAchievements();

      console.log(`🏆 Special achievement unlocked: ${achievement.title}`);
      return true;
    } catch (error) {
      console.error('Error unlocking special achievement:', error);
      return false;
    }
  }
}

export default AchievementService.getInstance();