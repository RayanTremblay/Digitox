import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Modal, TextInput, Alert } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Header from '../components/Header';
import CircularProgress from '../components/CircularProgress';
import ProgressBar from '../components/ProgressBar';
import { getDetoxStats, getWeeklyProgress, WeeklyProgress, checkAndResetDailyStats, resetAllStatsToZero } from '../utils/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import LoginScreen from './LoginScreen';
import ReferralModal from '../components/ReferralModal';
import DailyRewardsModal from '../components/DailyRewardsModal';
import { claimDailyReward, getDailyRewardsStats } from '../utils/dailyRewardsManager';
import { activateAdBoost, getBoostStats, shouldApplyBoostMultiplier } from '../utils/boostManager';
import achievementService from '../services/achievementService';
import AchievementPreview from '../components/AchievementPreview';
import { RootStackParamList } from '../types/navigation';

type NavigationProp = StackNavigationProp<RootStackParamList>;

// Storage key for daily goal
const DAILY_GOAL_KEY = '@detoxly_daily_goal';

// Constants for boost feature
const BOOST_THRESHOLD_MINUTES = 180; // 3 hours

const HomeScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [timeSpent, setTimeSpent] = useState(0); // minutes
  const [weekProgress, setWeekProgress] = useState<WeeklyProgress>({ 
    Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 
  });
  const [dailyGoal, setDailyGoal] = useState(120); // minutes
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [newGoalValue, setNewGoalValue] = useState('');
  const [boostMultiplier, setBoostMultiplier] = useState(1); // Default multiplier is 1x
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [showDailyRewardsModal, setShowDailyRewardsModal] = useState(false);
  const [dailyRewardsStats, setDailyRewardsStats] = useState({
    claimsToday: 0,
    maxClaims: 3,
    remainingClaims: 3,
    canClaim: true,
  });
  const [boostStats, setBoostStats] = useState({
    isAdBoostActive: false,
    remainingMinutes: 0,
    totalAdBoostsUsed: 0,
    canActivateAdBoost: true,
  });

  // Get current day and create week data
  const getCurrentWeekData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    const today = now.getDay(); // Get current day (0 = Sunday, 1 = Monday, etc.)
    
        // Debug logs removed for production 
    
    // Map the days to display format
    const weekData = days.map((day, index) => {
      // Use the stored progress for each day
      const dayProgress = weekProgress[day as keyof WeeklyProgress];
      
      // If it's today, use the most up-to-date time value
      const timeValue = index === today ? timeSpent : dayProgress;
      
      // Debug log removed 
      return { day, timeSpent: timeValue };
    });
    
    return weekData;
  };

  const [weekData, setWeekData] = useState(getCurrentWeekData());

  useEffect(() => {
    const initializeHomeScreen = async () => {
      await loadDailyStats();
      loadDailyGoal();
      loadDailyRewardsStats();
      loadBoostStats();
      
      // Check achievements when home screen loads
      try {
        await achievementService.checkAchievements();
      } catch (error) {
        console.error('Error checking achievements on home screen:', error);
      }
    };
    
    initializeHomeScreen();
  }, []);

  const loadDailyStats = async () => {
    // Check for midnight reset first
    await checkAndResetDailyStats();
    
    // Load daily stats
    const stats = await getDetoxStats();
    // Debug log removed
    
    // Convert seconds to minutes for display
    const minutes = Math.floor(stats.dailyTimeSaved / 60);
    // Debug log removed
    setTimeSpent(minutes);
    
    // Update boost multiplier using new logic (considers both ad boost and time boost)
    const boostResult = await shouldApplyBoostMultiplier(minutes);
    setBoostMultiplier(boostResult.multiplier);
    // Debug log removed
    
    // Load weekly progress
    const progress = await getWeeklyProgress();
    // Debug log removed
    setWeekProgress(progress);
  };

  const loadDailyGoal = async () => {
    try {
      const savedGoal = await AsyncStorage.getItem(DAILY_GOAL_KEY);
      if (savedGoal !== null) {
        setDailyGoal(parseInt(savedGoal, 10));
      }
    } catch (error) {
      console.error('Error loading daily goal:', error);
    }
  };

  const loadDailyRewardsStats = async () => {
    try {
      const stats = await getDailyRewardsStats();
      setDailyRewardsStats(stats);
    } catch (error) {
      console.error('Error loading daily rewards stats:', error);
    }
  };

  const loadBoostStats = async () => {
    try {
      const stats = await getBoostStats();
      setBoostStats(stats);
    } catch (error) {
      console.error('Error loading boost stats:', error);
    }
  };

  const handleClaimDailyReward = async () => {
    try {
      const result = await claimDailyReward();
      
      if (result.success && result.reward !== undefined) {
        // Reload stats to update UI
        await loadDailyRewardsStats();
        await loadDailyStats(); // Update balance display
        
        Alert.alert(
          'Daily Reward Claimed!',
          `Congratulations! You earned ${result.reward} Detoxcoins!`,
          [{ text: 'Awesome!' }]
        );
      } else {
        Alert.alert(
          'Claim Failed',
          result.error || 'Failed to claim daily reward. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error claiming daily reward:', error);
      Alert.alert(
        'Error',
        'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleActivateBoost = async () => {
    try {
      const result = await activateAdBoost();
      
      if (result.success) {
        // Reload stats to update UI
        await loadBoostStats();
        await loadDailyStats(); // Update boost multiplier display
        
        Alert.alert(
          '2x Boost Activated!',
          'Amazing! You now have 2x boost for the next 2 hours!',
          [{ text: 'Awesome!' }]
        );
      } else {
        Alert.alert(
          'Boost Activation Failed',
          result.error || 'Failed to activate boost. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error activating boost:', error);
      Alert.alert(
        'Error',
        'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleSaveGoal = async () => {
    try {
      // Parse and validate the new goal value
      const goalValue = parseInt(newGoalValue, 10);
      if (isNaN(goalValue) || goalValue <= 0) {
        console.error('Invalid goal value');
        return;
      }
      
      // Save the new goal
      await AsyncStorage.setItem(DAILY_GOAL_KEY, goalValue.toString());
      setDailyGoal(goalValue);
      setShowGoalModal(false);
      
      // Reset the input
      setNewGoalValue('');
      
      // Update week data with new goal
    setWeekData(getCurrentWeekData());
    } catch (error) {
      console.error('Error saving daily goal:', error);
    }
  };

  // Add effect to update week data when timeSpent or weekProgress changes
  useEffect(() => {
    setWeekData(getCurrentWeekData());
  }, [timeSpent, weekProgress, dailyGoal]);

  // Refresh stats when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadDailyStats();
      loadDailyRewardsStats();
      loadBoostStats();
    });

    return unsubscribe;
  }, [navigation]);
  
  // Check for midnight reset every minute when app is active
  useEffect(() => {
    const intervalId = setInterval(() => {
      checkAndResetDailyStats().then(() => {
        loadDailyStats();
      });
    }, 60000); // Check every minute
    
    return () => clearInterval(intervalId);
  }, []);

  // Calculate boost progress percentage
  const boostProgressPercentage = Math.min(timeSpent / BOOST_THRESHOLD_MINUTES, 1);

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
          <Header />
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Detoxly</Text>
          </View>

          <View style={styles.detoxCard}>
            <Text style={styles.detoxTitle}>Time off your phone today</Text>
            <Text style={styles.timeText}>{timeSpent}min</Text>
            <TouchableOpacity 
              style={styles.goalButton}
              onPress={() => setShowGoalModal(true)}
            >
            <Text style={styles.goalText}>Daily goal: {dailyGoal}min</Text>
              <Icon name="pencil" size={16} color={colors.text} style={styles.editIcon} />
            </TouchableOpacity>
            
            <View style={styles.startButtonContainer}>
            <TouchableOpacity 
              style={styles.startButton}
              onPress={() => navigation.navigate('Detox')}
            >
              <Text style={styles.startButtonText}>Start Detox</Text>
            </TouchableOpacity>
              
              {/* Boost multiplier indicator */}
              <View style={styles.boostContainer}>
                <View style={styles.boostInfo}>
                  <Text style={styles.boostLabel}>Boost</Text>
                  <Text style={[
                    styles.boostValue, 
                    boostMultiplier > 1 ? styles.boostActive : null
                  ]}>
                    {boostMultiplier}x
                  </Text>
                </View>
                <ProgressBar 
                  progress={boostProgressPercentage} 
                  height={3}
                  progressColor={boostMultiplier > 1 ? '#4CAF50' : colors.primary}
                />
                <Text style={styles.boostHint}>
                  {boostMultiplier > 1 
                    ? (boostStats.isAdBoostActive 
                        ? `2x boost active! (${boostStats.remainingMinutes}min left)` 
                        : "2x boost active!")
                    : `${Math.floor(BOOST_THRESHOLD_MINUTES - timeSpent)}min until 2x boost`}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.weekProgress}>
            {weekData.map((day, index) => (
              <View key={day.day} style={styles.dayContainer}>
                <CircularProgress
                  size={32}
                  progress={day.timeSpent / dailyGoal}
                  strokeWidth={3}
                />
                <Text style={styles.dayText}>{day.day}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity 
            style={styles.inviteCard}
            onPress={() => setShowReferralModal(true)}
          >
            <Text style={styles.inviteTitle}>Invite friends & win a giftcard</Text>
            <Text style={styles.inviteSubtitle}>Join the challenge</Text>
          </TouchableOpacity>

          <View style={styles.rewardsContainer}>
            <View style={styles.rewardCard}>
              <View style={styles.rewardValueContainer}>
                <Image
                  source={require('../assets/logo.png')}
                  style={styles.currencyIcon}
                  resizeMode="contain"
                />
                <Text style={styles.rewardValue}>20</Text>
              </View>
              <Text style={styles.rewardText}>For inviting a friend</Text>
              <TouchableOpacity 
                style={styles.rewardButton}
                onPress={() => setShowReferralModal(true)}
              >
                <View style={styles.buttonContent}>
                  <Image
                    source={require('../assets/logo.png')}
                    style={styles.smallCurrencyIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.rewardButtonText}>Get 20</Text>
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.rewardCard}
              onPress={() => setShowDailyRewardsModal(true)}
            >
              <Text style={styles.rewardValue}>
                {dailyRewardsStats.claimsToday}/{dailyRewardsStats.maxClaims}
              </Text>
              <Text style={styles.rewardText}>Daily Rewards claimed</Text>
              <View 
                style={[
                  styles.rewardButton,
                  !dailyRewardsStats.canClaim && styles.rewardButtonDisabled
                ]}
              >
                <Text style={[
                  styles.rewardButtonText,
                  !dailyRewardsStats.canClaim && styles.rewardButtonTextDisabled
                ]}>
                  {dailyRewardsStats.canClaim ? 'Claim' : 'Done'}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.rewardCard}
              onPress={handleActivateBoost}
            >
              <Text style={styles.rewardValue}>2X</Text>
              <Text style={styles.rewardText}>Activate 2X Boost</Text>
              <View 
                style={[
                  styles.rewardButton,
                  !boostStats.canActivateAdBoost && styles.rewardButtonDisabled
                ]}
              >
                <Text style={[
                  styles.rewardButtonText,
                  !boostStats.canActivateAdBoost && styles.rewardButtonTextDisabled
                ]}>
                  {boostStats.canActivateAdBoost ? 'Watch Ad' : 'Active'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Achievement Preview */}
          <AchievementPreview onPress={() => navigation.navigate('Achievements')} />
          
          {/* Reset button for testing */}
          <TouchableOpacity 
            style={styles.resetButton}
            onPress={() => {
              Alert.alert(
                "Reset All Stats",
                "This will reset all your stats to zero for testing purposes. Are you sure?",
                [
                  {
                    text: "Cancel",
                    style: "cancel"
                  },
                  { 
                    text: "Reset", 
                    onPress: async () => {
                      await resetAllStatsToZero();
                      loadDailyStats(); // Reload stats after reset
                    },
                    style: "destructive"
                  }
                ]
              );
            }}
          >
            <Text style={styles.resetButtonText}>Reset All Stats (Testing)</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      

      {/* Daily Goal Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showGoalModal}
        onRequestClose={() => setShowGoalModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Daily Goal</Text>
            
            <TextInput
              style={styles.goalInput}
              placeholder="Enter minutes"
              keyboardType="number-pad"
              value={newGoalValue}
              onChangeText={setNewGoalValue}
              placeholderTextColor={colors.textSecondary}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowGoalModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveGoal}
              >
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Referral Modal */}
      <ReferralModal
        visible={showReferralModal}
        onClose={() => setShowReferralModal(false)}
        onReferralComplete={() => {
          // Reload stats when a referral is completed
          loadDailyStats();
        }}
      />

      {/* Daily Rewards Modal */}
      <DailyRewardsModal
        visible={showDailyRewardsModal}
        onClose={() => setShowDailyRewardsModal(false)}
        onRewardClaimed={() => {
          // Reload stats when a reward is claimed
          loadDailyRewardsStats();
          loadDailyStats(); // Update balance display
        }}
      />
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
  titleContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.logo,
    textAlign: 'center',
    color: '#CCCCCC',
  },
  detoxCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  detoxTitle: {
    ...typography.body,
    marginBottom: spacing.sm,
  },
  timeText: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  goalButton: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '500',
  },
  startButtonContainer: {
    width: '100%',
  },
  startButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  startButtonText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  weekProgress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    paddingVertical: spacing.lg,
  },
  dayContainer: {
    alignItems: 'center',
  },
  dayText: {
    ...typography.caption,
    marginTop: spacing.xs,
    color: colors.textSecondary,
  },
  inviteCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  inviteTitle: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  inviteSubtitle: {
    ...typography.caption,
  },
  rewardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  rewardCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.xs,
    alignItems: 'center',
    minHeight: 180,
    justifyContent: 'space-between',
  },
  rewardIcon: {
    width: 24,
    height: 24,
    marginBottom: spacing.xs,
  },
  rewardValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  currencyIcon: {
    width: 34,
    height: 34,
    marginRight: spacing.xs,
  },
  smallCurrencyIcon: {
    width: 20,
    height: 20,
    marginRight: spacing.xs,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  rewardValue: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  rewardText: {
    ...typography.caption,
    textAlign: 'center',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  rewardButton: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
    marginTop: 'auto',
    width: 100,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardButtonText: {
    ...typography.caption,
    color: colors.text,
  },
  rewardButtonDisabled: {
    backgroundColor: colors.surface,
    opacity: 0.5,
  },
  rewardButtonTextDisabled: {
    color: colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    width: '80%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  goalInput: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    width: '100%',
    color: colors.text,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.round,
    minWidth: 120,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.surfaceLight,
    marginRight: spacing.sm,
  },
  saveButton: {
    backgroundColor: colors.primary,
    marginLeft: spacing.sm,
  },
  modalButtonText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  editIcon: {
    marginLeft: spacing.xs,
  },
  resetButton: {
    backgroundColor: '#FF4444',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.round,
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  resetButtonText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  boostContainer: {
    marginTop: spacing.xs,
    width: '100%',
  },
  boostInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  boostLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
  },
  boostValue: {
    ...typography.caption,
    fontWeight: '600',
    fontSize: 12,
  },
  boostActive: {
    color: colors.text,
  },
  boostHint: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 2,
    textAlign: 'right',
  },
});

export default HomeScreen; 