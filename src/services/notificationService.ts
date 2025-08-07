import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const NOTIFICATION_TOKEN_KEY = '@notification_token';
const NOTIFICATION_SETTINGS_KEY = '@notification_settings';
const LAST_NOTIFICATION_TIME_KEY = '@last_notification_time';

// Default notification settings
export interface NotificationSettings {
  enabled: boolean;
  frequency: 'low' | 'medium' | 'high'; // low=3/day, medium=5/day, high=8/day
  quietHoursStart: string; // "22:00"
  quietHoursEnd: string; // "08:00"
  motivationalStyle: 'gentle' | 'encouraging' | 'challenging';
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  frequency: 'medium',
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
  motivationalStyle: 'encouraging'
};

// Motivational messages categorized by style
const NOTIFICATION_MESSAGES = {
  gentle: [
    "🌱 Take a moment to breathe. Your phone will be here when you're ready.",
    "How about a 10-minute digital break? Your mind deserves some peace.",
    "🌸 Small steps away from your screen can lead to big changes in your day.",
    "Your phone doesn't need your attention right now. You deserve this break.",
    "🌺 Consider putting your phone aside and enjoying the present moment.",
    "🌿 A gentle reminder: real life is happening beyond your screen.",
    "💙 Your well-being matters more than any notification. Take a break.",
    "🌅 Every moment away from your phone is a gift to yourself."
  ],
  encouraging: [
      "You've got this! Time for a digital detox break - your future self will thank you!",
  "Ready to reclaim your time? Put that phone down and do something amazing!",
  "Break free from the scroll! Your real life adventure is waiting.",
  "You're stronger than your phone's pull. Show it who's boss!",
  "Every minute offline is a victory. You're building amazing habits!",
  "Your focus is your superpower. Use it for something meaningful today!",
  "Time to shine! Put your phone away and light up the real world.",
  "You're worth more than endless scrolling. Go create something beautiful!"
  ],
  challenging: [
    "⚡ Stop scrolling, start living! Your dreams won't achieve themselves.",
    "The digital circus can wait. Your real life needs the main character - YOU!",
    "🔋 Your battery isn't the only thing that needs charging. Recharge your LIFE!",
    "⏰ Time is your most valuable currency. Stop spending it on your phone!",
    "Stop being a spectator of other people's lives. GO LIVE YOUR OWN!",
    "Your phone is keeping you from your potential. BREAK FREE NOW!",
    "You're the artist of your life. Put down the phone and pick up the brush!",
    "Don't drown in the digital ocean. SWIM TO SHORE and live authentically!"
  ]
};

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class NotificationService {
  private static instance: NotificationService;
  private settings: NotificationSettings = DEFAULT_SETTINGS;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Initialize notification service and request permissions
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('🔔 Initializing notification service...');
      
      // Load saved settings
      await this.loadSettings();
      
      if (!this.settings.enabled) {
        console.log('📴 Notifications disabled by user');
        return false;
      }

      // Request permissions
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log('Notification permissions denied');
        return false;
      }

      // Get and store push token
      const token = await this.registerForPushNotifications();
      if (token) {
        console.log('Notification service initialized successfully');
        await this.scheduleNotifications();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      return false;
    }
  }

  /**
   * Request notification permissions
   */
  private async requestPermissions(): Promise<boolean> {
    try {
      if (!Device.isDevice) {
        console.log('Notifications only work on physical devices');
        return false;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Notification permissions not granted');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  /**
   * Register for push notifications and get token
   */
  private async registerForPushNotifications(): Promise<string | null> {
    try {
      let token: string | undefined;

      if (Device.isDevice) {
        const { data } = await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId,
        });
        token = data;
        console.log('Push token:', token);
      } else {
        console.log('Must use physical device for push notifications');
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      if (token) {
        await AsyncStorage.setItem(NOTIFICATION_TOKEN_KEY, token);
      }

      return token || null;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  /**
   * Schedule local notifications based on user preferences
   */
  async scheduleNotifications(): Promise<void> {
    try {
      // Cancel existing notifications
      await Notifications.cancelAllScheduledNotificationsAsync();

      if (!this.settings.enabled) {
        return;
      }

      const frequencies = {
        low: 3,    // 3 times per day
        medium: 5, // 5 times per day  
        high: 8    // 8 times per day
      };

      const notificationsPerDay = frequencies[this.settings.frequency];
      const messages = NOTIFICATION_MESSAGES[this.settings.motivationalStyle];

      // Schedule notifications for the next 7 days
      for (let day = 0; day < 7; day++) {
        for (let i = 0; i < notificationsPerDay; i++) {
          const timeSlot = this.calculateNotificationTime(i, notificationsPerDay, day);
          const message = messages[Math.floor(Math.random() * messages.length)];

          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Digital Detox Reminder',
              body: message,
              sound: true,
            },
            trigger: timeSlot,
          });
        }
      }

      console.log(`Scheduled ${notificationsPerDay * 7} notifications for the next 7 days`);
    } catch (error) {
      console.error('Error scheduling notifications:', error);
    }
  }

  /**
   * Calculate optimal notification times avoiding quiet hours
   */
  private calculateNotificationTime(index: number, total: number, dayOffset: number): Date {
    const now = new Date();
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + dayOffset);

    // Parse quiet hours
    const [quietStartHour, quietStartMin] = this.settings.quietHoursStart.split(':').map(Number);
    const [quietEndHour, quietEndMin] = this.settings.quietHoursEnd.split(':').map(Number);

    // Define active hours (avoiding quiet time)
    const activeStartHour = quietEndHour + 1; // 1 hour after quiet hours end
    const activeEndHour = quietStartHour - 1; // 1 hour before quiet hours start

    // Calculate time slots within active hours
    const activeHours = activeEndHour - activeStartHour;
    const interval = activeHours / total;
    const targetHour = activeStartHour + (interval * index);

    // Add some randomness (±30 minutes) to make it feel more natural
    const randomOffset = (Math.random() - 0.5) * 60; // ±30 minutes in minutes
    const finalMinutes = (targetHour % 1) * 60 + randomOffset;

    targetDate.setHours(Math.floor(targetHour), Math.max(0, Math.min(59, finalMinutes)));
    targetDate.setSeconds(0);

    return targetDate;
  }

  /**
   * Send an immediate encouragement notification
   */
  async sendImmediateEncouragement(): Promise<void> {
    try {
      if (!this.settings.enabled) {
        return;
      }

      const messages = NOTIFICATION_MESSAGES[this.settings.motivationalStyle];
      const message = messages[Math.floor(Math.random() * messages.length)];

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'You\'ve Got This!',
          body: message,
          sound: true,
        },
        trigger: null, // Send immediately
      });

      console.log('📢 Sent immediate encouragement notification');
    } catch (error) {
      console.error('Error sending immediate notification:', error);
    }
  }

  /**
   * Update notification settings
   */
  async updateSettings(newSettings: Partial<NotificationSettings>): Promise<void> {
    try {
      this.settings = { ...this.settings, ...newSettings };
      await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(this.settings));
      
      if (this.settings.enabled) {
        await this.scheduleNotifications();
      } else {
        await Notifications.cancelAllScheduledNotificationsAsync();
      }

      console.log('Notification settings updated');
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  }

  /**
   * Load settings from storage
   */
  private async loadSettings(): Promise<void> {
    try {
      const saved = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (saved) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
      this.settings = DEFAULT_SETTINGS;
    }
  }

  /**
   * Get current settings
   */
  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  /**
   * Check if notifications are enabled
   */
  async isEnabled(): Promise<boolean> {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted' && this.settings.enabled;
  }

  /**
   * Get a preview message for the current style
   */
  getPreviewMessage(): string {
    const messages = NOTIFICATION_MESSAGES[this.settings.motivationalStyle];
    return messages[0];
  }
}

export default NotificationService.getInstance();