import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import StatsModal from '../components/StatsModal';
import { getDetoxStats, updateStreak } from '../utils/storage';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logoutUser } from '../../firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../types/navigation';
import notificationService, { NotificationSettings } from '../services/notificationService';

// Storage key for daily goal
const DAILY_GOAL_KEY = '@detoxly_daily_goal';

type NavigationProp = StackNavigationProp<RootStackParamList>;

const ProfileScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user, syncUserData, backupData, restoreData } = useAuth();
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    enabled: true,
    frequency: 'medium',
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    motivationalStyle: 'encouraging'
  });
  const [userStats, setUserStats] = useState({
    currentBalance: 0,
    totalEarned: 0,
    totalTimeSaved: 0,
    currentStreak: 0,
    todayDetoxTime: 0,
  });
  const [dailyGoal, setDailyGoal] = useState(120); // Default 120 minutes
  const [newGoalValue, setNewGoalValue] = useState('');

  // Load real data from storage
  useEffect(() => {
    const loadData = async () => {
      const stats = await getDetoxStats();
      const updatedStreak = await updateStreak();
      const savedGoal = await AsyncStorage.getItem(DAILY_GOAL_KEY);
      
      setUserStats({
        currentBalance: stats.balance,
        totalEarned: stats.totalEarned,
        totalTimeSaved: stats.totalTimeSaved,
        currentStreak: updatedStreak,
        todayDetoxTime: stats.todayDetoxTime,
      });
      
      if (savedGoal !== null) {
        setDailyGoal(parseInt(savedGoal, 10));
        setNewGoalValue(savedGoal);
      }

      // Load notification settings
      const currentNotificationSettings = notificationService.getSettings();
      setNotificationSettings(currentNotificationSettings);
    };
    
    loadData();
    
    // Refresh data when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    
    return unsubscribe;
  }, [navigation]);

  const handleUpdateGoal = async () => {
    try {
      const goalValue = parseInt(newGoalValue, 10);
      if (isNaN(goalValue) || goalValue <= 0) {
        return;
      }
      
      await AsyncStorage.setItem(DAILY_GOAL_KEY, goalValue.toString());
      setDailyGoal(goalValue);
      setShowGoalModal(false);
    } catch (error) {
      console.error('Error updating daily goal:', error);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await logoutUser();
              if (result.success) {
                // The AuthContext will automatically handle the navigation
                // back to the login screen when the user state changes
              } else {
                Alert.alert('Error', result.error || 'Failed to logout');
              }
            } catch (error) {
              Alert.alert('Error', 'An unexpected error occurred during logout');
            }
          },
        },
      ]
    );
  };

  const handleSyncData = async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    try {
      const result = await syncUserData();
      if (result.success) {
        Alert.alert('Success', 'Your data has been synchronized successfully!');
        // Reload local data
        const stats = await getDetoxStats();
        const updatedStreak = await updateStreak();
        setUserStats({
          currentBalance: stats.balance,
          totalEarned: stats.totalEarned,
          totalTimeSaved: stats.totalTimeSaved,
          currentStreak: updatedStreak,
          todayDetoxTime: stats.todayDetoxTime,
        });
      } else {
        Alert.alert('Sync Failed', result.error || 'Failed to sync data');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An unexpected error occurred');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleBackupData = async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    try {
      const result = await backupData();
      if (result.success) {
        Alert.alert('Success', 'Your data has been backed up to the cloud!');
      } else {
        Alert.alert('Backup Failed', result.error || 'Failed to backup data');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An unexpected error occurred');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRestoreData = async () => {
    if (isSyncing) return;
    
    Alert.alert(
      'Restore Data',
      'This will overwrite your local data with data from the cloud. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: async () => {
            setIsSyncing(true);
            try {
              const result = await restoreData();
              if (result.success) {
                Alert.alert('Success', 'Your data has been restored from the cloud!');
                // Reload local data
                const stats = await getDetoxStats();
                const updatedStreak = await updateStreak();
                setUserStats({
                  currentBalance: stats.balance,
                  totalEarned: stats.totalEarned,
                  totalTimeSaved: stats.totalTimeSaved,
                  currentStreak: updatedStreak,
                  todayDetoxTime: stats.todayDetoxTime,
                });
              } else {
                Alert.alert('Restore Failed', result.error || 'Failed to restore data');
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || 'An unexpected error occurred');
            } finally {
              setIsSyncing(false);
            }
          },
        },
      ]
    );
  };

  const handleUpdateNotificationSettings = async (updates: Partial<NotificationSettings>) => {
    try {
      const newSettings = { ...notificationSettings, ...updates };
      setNotificationSettings(newSettings);
      await notificationService.updateSettings(updates);
      
      if (updates.enabled !== undefined) {
        const message = updates.enabled 
          ? 'Notifications enabled! You\'ll receive encouraging reminders.'
          : 'Notifications disabled. You can re-enable them anytime.';
        Alert.alert('Notifications Updated', message);
      }
    } catch (error) {
      console.error('Error updating notification settings:', error);
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };

  const handleTestNotification = async () => {
    try {
      await notificationService.sendImmediateEncouragement();
      Alert.alert('Test Sent!', 'Check your notifications for a motivational message.');
    } catch (error) {
      console.error('Error sending test notification:', error);
      Alert.alert('Error', 'Failed to send test notification');
    }
  };

  // Calculate daily progress
  const dailyProgress = Math.min(
    (userStats.todayDetoxTime / 60) / dailyGoal * 100,
    100
  );

  // Format time in minutes
  const formatTime = (seconds: number) => {
    return `${Math.floor(seconds / 60)}min`;
  };

  return (
    <LinearGradient
      colors={['#1D2024', '#6E7A8A']}
      style={styles.container}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.balance}
              onPress={() => setShowStatsModal(true)}
            >
              <Image
                source={require('../assets/logo.png')}
                style={styles.coinIcon}
                resizeMode="contain"
              />
              <Text style={styles.balanceText}>{userStats.currentBalance.toFixed(2)}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.profileSection}>
            <View style={styles.profileImageContainer}>
              <Text style={styles.profileImageText}>
                {user?.displayName 
                  ? user.displayName.split(' ').map(name => name[0]).join('').toUpperCase()
                  : user?.email?.[0]?.toUpperCase() || 'U'
                }
              </Text>
            </View>
            <Text style={styles.profileName}>
              {user?.displayName || user?.email?.split('@')[0] || 'User'}
            </Text>
            <Text style={styles.profileEmail}>{user?.email || 'No email'}</Text>
          </View>

          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Image
                source={require('../assets/logo.png')}
                style={styles.statIcon}
                resizeMode="contain"
              />
              <Text style={styles.statValue}>{Math.floor(userStats.totalEarned)}</Text>
              <Text style={styles.statLabel}>Total Detoxcoins</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="flame-outline" size={24} color={colors.primary} />
              <Text style={styles.statValue}>{userStats.currentStreak}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="timer-outline" size={24} color={colors.primary} />
              <Text style={styles.statValue}>{formatTime(userStats.totalTimeSaved)}</Text>
              <Text style={styles.statLabel}>Total Detox Time</Text>
            </View>
          </View>

          <View style={styles.goalsHeader}>
            <Text style={styles.sectionTitle}>Goals</Text>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => setShowGoalModal(true)}
            >
              <Ionicons name="pencil" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <Text style={styles.goalTitle}>Time off your phone today</Text>
              <Text style={styles.goalProgress}>
                {formatTime(userStats.todayDetoxTime)}/{dailyGoal}min
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${dailyProgress}%` }
                ]} 
              />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Data Management</Text>
          <View style={styles.settingsContainer}>
            <TouchableOpacity 
              style={[styles.settingButton, isSyncing && styles.settingButtonDisabled]}
              onPress={handleSyncData}
              disabled={isSyncing}
            >
              <Text style={styles.settingText}>
                {isSyncing ? 'Syncing...' : 'Sync Data'}
              </Text>
              <Ionicons name="sync" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.settingButton, isSyncing && styles.settingButtonDisabled]}
              onPress={handleBackupData}
              disabled={isSyncing}
            >
              <Text style={styles.settingText}>
                {isSyncing ? 'Processing...' : 'Backup to Cloud'}
              </Text>
              <Ionicons name="cloud-upload" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.settingButton, isSyncing && styles.settingButtonDisabled]}
              onPress={handleRestoreData}
              disabled={isSyncing}
            >
              <Text style={styles.settingText}>
                {isSyncing ? 'Processing...' : 'Restore from Cloud'}
              </Text>
              <Ionicons name="cloud-download" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Notification Settings</Text>
          <View style={styles.settingsContainer}>
            <TouchableOpacity 
              style={styles.settingButton}
              onPress={() => setShowNotificationModal(true)}
            >
              <Text style={styles.settingText}>Detox Reminders</Text>
              <View style={styles.settingRight}>
                <Text style={styles.settingValue}>
                  {notificationSettings.enabled ? 'On' : 'Off'}
                </Text>
                <Text style={styles.settingArrow}>→</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.settingButton}
              onPress={handleTestNotification}
            >
              <Text style={styles.settingText}>Test Notification</Text>
              <Ionicons name="notifications" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.settingsContainer}>
            <TouchableOpacity 
              style={styles.settingButton}
              onPress={() => navigation.navigate('Achievements')}
            >
                                  <Text style={styles.settingText}>Achievements</Text>
              <Text style={styles.settingArrow}>→</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.settingButton}
              onPress={() => navigation.navigate('Privacy')}
            >
              <Text style={styles.settingText}>Privacy</Text>
              <Text style={styles.settingArrow}>→</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.settingButton}
              onPress={() => navigation.navigate('HelpSupport')}
            >
              <Text style={styles.settingText}>Help & Support</Text>
              <Text style={styles.settingArrow}>→</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Stats Modal */}
      <StatsModal
        visible={showStatsModal}
        onClose={() => setShowStatsModal(false)}
        stats={userStats}
      />

      {/* Goals Modal */}
      <Modal
        visible={showGoalModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGoalModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Daily Goal</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Daily Goal (minutes)</Text>
              <TextInput
                style={styles.input}
                value={newGoalValue}
                onChangeText={setNewGoalValue}
                keyboardType="numeric"
                placeholder="Enter daily goal"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowGoalModal(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleUpdateGoal}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Notification Settings Modal */}
      <Modal
        visible={showNotificationModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNotificationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Notification Settings</Text>
            
            {/* Enable/Disable Notifications */}
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Enable Notifications</Text>
              <TouchableOpacity 
                style={[styles.toggle, notificationSettings.enabled && styles.toggleActive]}
                onPress={() => handleUpdateNotificationSettings({ enabled: !notificationSettings.enabled })}
              >
                <View style={[styles.toggleSlider, notificationSettings.enabled && styles.toggleSliderActive]} />
              </TouchableOpacity>
            </View>

            {notificationSettings.enabled && (
              <>
                {/* Frequency */}
                <View style={styles.settingSection}>
                  <Text style={styles.settingLabel}>Frequency</Text>
                  <View style={styles.frequencyButtons}>
                    {(['low', 'medium', 'high'] as const).map((freq) => (
                      <TouchableOpacity 
                        key={freq}
                        style={[
                          styles.frequencyButton,
                          notificationSettings.frequency === freq && styles.frequencyButtonActive
                        ]}
                        onPress={() => handleUpdateNotificationSettings({ frequency: freq })}
                      >
                        <Text style={[
                          styles.frequencyButtonText,
                          notificationSettings.frequency === freq && styles.frequencyButtonTextActive
                        ]}>
                          {freq === 'low' ? '3/day' : freq === 'medium' ? '5/day' : '8/day'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Motivational Style */}
                <View style={styles.settingSection}>
                  <Text style={styles.settingLabel}>Message Style</Text>
                  <View style={styles.styleButtons}>
                    {(['gentle', 'encouraging', 'challenging'] as const).map((style) => (
                      <TouchableOpacity 
                        key={style}
                        style={[
                          styles.styleButton,
                          notificationSettings.motivationalStyle === style && styles.styleButtonActive
                        ]}
                        onPress={() => handleUpdateNotificationSettings({ motivationalStyle: style })}
                      >
                        <Text style={[
                          styles.styleButtonText,
                          notificationSettings.motivationalStyle === style && styles.styleButtonTextActive
                        ]}>
                          {style.charAt(0).toUpperCase() + style.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Preview Message */}
                <View style={styles.previewSection}>
                  <Text style={styles.settingLabel}>Preview Message</Text>
                  <Text style={styles.previewText}>
                    {notificationService.getPreviewMessage()}
                  </Text>
                </View>

                {/* Quiet Hours */}
                <View style={styles.settingSection}>
                  <Text style={styles.settingLabel}>Quiet Hours</Text>
                  <Text style={styles.quietHoursText}>
                    {notificationSettings.quietHoursStart} - {notificationSettings.quietHoursEnd}
                  </Text>
                  <Text style={styles.quietHoursDescription}>
                    No notifications during these hours
                  </Text>
                </View>
              </>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={() => setShowNotificationModal(false)}
              >
                <Text style={styles.buttonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    marginTop: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.round,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    marginTop: 40,
  },
  backButtonText: {
    fontSize: 32,
    color: colors.text,
    height: 40,
    width: 40,
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 40,
    includeFontPadding: false,
    fontWeight: 'bold',
  },
  balance: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
    marginTop: 40,
  },
  coinIcon: {
    width: 20,
    height: 20,
    marginRight: spacing.xs,
  },
  balanceText: {
    ...typography.body,
    fontWeight: '600',
  },
  profileSection: {
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  profileImageText: {
    ...typography.h1,
    color: colors.text,
  },
  profileName: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  profileEmail: {
    ...typography.body,
    color: colors.textSecondary,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  statCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  statIcon: {
    width: 24,
    height: 24,
    marginBottom: spacing.xs,
  },
  statValue: {
    ...typography.h3,
    color: colors.text,
    marginVertical: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  goalsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  editButton: {
    padding: spacing.xs,
  },
  goalCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  goalTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  goalProgress: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.background,
    borderRadius: borderRadius.round,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.round,
  },
  settingsContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.md,
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  settingButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  settingText: {
    ...typography.body,
    color: colors.text,
  },
  settingArrow: {
    ...typography.body,
    color: colors.textSecondary,
  },
  logoutButton: {
    backgroundColor: '#FF4444',
    borderRadius: borderRadius.round,
    padding: spacing.md,
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  logoutText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    ...typography.body,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  modalButton: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.xs,
  },
  cancelButton: {
    backgroundColor: colors.error,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  buttonText: {
    ...typography.body,
    color: colors.text,
    textAlign: 'center',
  },
  settingButtonDisabled: {
    opacity: 0.5,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  settingValue: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 14,
  },
  // Notification Settings Modal Styles
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  settingSection: {
    marginBottom: spacing.lg,
  },
  settingLabel: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.background,
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: colors.primary,
  },
  toggleSlider: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.textSecondary,
  },
  toggleSliderActive: {
    backgroundColor: colors.text,
    alignSelf: 'flex-end',
  },
  frequencyButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  frequencyButton: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  frequencyButtonActive: {
    backgroundColor: colors.primary,
  },
  frequencyButtonText: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 14,
  },
  frequencyButtonTextActive: {
    color: colors.text,
    fontWeight: '600',
  },
  styleButtons: {
    gap: spacing.sm,
  },
  styleButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  styleButtonActive: {
    backgroundColor: colors.primary,
  },
  styleButtonText: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 14,
  },
  styleButtonTextActive: {
    color: colors.text,
    fontWeight: '600',
  },
  previewSection: {
    marginBottom: spacing.lg,
  },
  previewText: {
    ...typography.body,
    color: colors.textSecondary,
    fontStyle: 'italic',
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    lineHeight: 20,
  },
  quietHoursText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  quietHoursDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});

export default ProfileScreen; 