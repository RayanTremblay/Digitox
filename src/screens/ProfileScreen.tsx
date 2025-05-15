import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import StatsModal from '../components/StatsModal';

type RootStackParamList = {
  MainTabs: undefined;
  Profile: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

const ProfileScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [showStatsModal, setShowStatsModal] = useState(false);

  // Mock data - matching the data from Header component
  const userStats = {
    currentBalance: 150.88,
    totalEarned: 892.45,
    totalTimeSaved: 53460, // in seconds (about 14.85 hours)
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
              <Text style={styles.statValue}>24h</Text>
              <Text style={styles.statLabel}>Average Usage</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>7</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>450</Text>
              <Text style={styles.statLabel}>Total Digicoins</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Goals</Text>
          <View style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <Text style={styles.goalTitle}>Daily Screen Time</Text>
              <Text style={styles.goalProgress}>4/6 hrs</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '66%' }]} />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.settingsContainer}>
            {['Notification Settings', 'App Preferences', 'Privacy', 'Help & Support'].map((setting) => (
              <TouchableOpacity key={setting} style={styles.settingButton}>
                <Text style={styles.settingText}>{setting}</Text>
                <Text style={styles.settingArrow}>→</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.logoutButton}>
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <StatsModal
        visible={showStatsModal}
        onClose={() => setShowStatsModal(false)}
        stats={userStats}
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
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  statValue: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  goalCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  goalTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  goalProgress: {
    ...typography.body,
    color: colors.textSecondary,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.background,
    borderRadius: borderRadius.round,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
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
});

export default ProfileScreen; 