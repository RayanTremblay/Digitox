import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Modal, TextInput } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import StatsModal from '../components/StatsModal';
import { getDigiStats, updateStreak } from '../utils/storage';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage key for daily goal
const DAILY_GOAL_KEY = '@digitox_daily_goal';

type RootStackParamList = {
  MainTabs: undefined;
  Profile: undefined;
  Privacy: undefined;
  HelpSupport: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

const ProfileScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
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
      const stats = await getDigiStats();
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
              <Text style={styles.profileImageText}>RT</Text>
            </View>
            <Text style={styles.profileName}>Rayan Tremblay</Text>
            <Text style={styles.profileEmail}>rayan@example.com</Text>
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
              <Text style={styles.statLabel}>Total Digicoins</Text>
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

          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.settingsContainer}>
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

          <TouchableOpacity style={styles.logoutButton}>
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
});

export default ProfileScreen; 