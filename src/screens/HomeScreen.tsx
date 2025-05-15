import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Header from '../components/Header';
import CircularProgress from '../components/CircularProgress';

type RootStackParamList = {
  MainTabs: undefined;
  Profile: undefined;
  Detox: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

const HomeScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const timeSpent = 75; // minutes
  const dailyGoal = 120; // minutes

  // Mock data for the week's progress
  const weekData = [
    { day: 'Mon', timeSpent: 110 },
    { day: 'Tue', timeSpent: 120 },
    { day: 'Wed', timeSpent: 85 },
    { day: 'Thu', timeSpent: 75 }, // Today
    { day: 'Fri', timeSpent: 0 },
    { day: 'Sat', timeSpent: 0 },
    { day: 'Sun', timeSpent: 0 },
  ];

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
            <Text style={styles.title}>Digicoin</Text>
          </View>

          <View style={styles.detoxCard}>
            <Text style={styles.detoxTitle}>Times off your phone today</Text>
            <Text style={styles.timeText}>{timeSpent}min</Text>
            <Text style={styles.goalText}>Daily goal: {dailyGoal}min</Text>
            <TouchableOpacity 
              style={styles.startButton}
              onPress={() => navigation.navigate('Detox')}
            >
              <Text style={styles.startButtonText}>Start Detox</Text>
            </TouchableOpacity>
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

          <TouchableOpacity style={styles.inviteCard}>
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
              <TouchableOpacity style={styles.rewardButton}>
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

            <View style={styles.rewardCard}>
              <Text style={styles.rewardValue}>0/3</Text>
              <Text style={styles.rewardText}>Daily Rewards claimed</Text>
              <TouchableOpacity style={styles.rewardButton}>
                <Text style={styles.rewardButtonText}>Claim</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.rewardCard}>
              <Text style={styles.rewardValue}>2X</Text>
              <Text style={styles.rewardText}>Activate 2X Boost</Text>
              <TouchableOpacity style={styles.rewardButton}>
                <Text style={styles.rewardButtonText}>Get 2X</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
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
  goalText: {
    ...typography.caption,
    marginBottom: spacing.lg,
  },
  startButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
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
});

export default HomeScreen; 