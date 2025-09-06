import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Header from '../components/Header';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types/navigation';

type NavigationProp = StackNavigationProp<RootStackParamList>;

const MarketScreen = () => {
  const navigation = useNavigation<NavigationProp>();



  return (
    <LinearGradient colors={['#1D2024', '#6E7A8A']} style={styles.container}>
      <Header />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Marketplace</Text>
            <Text style={styles.subtitle}>Redeem your Detoxcoins for rewards</Text>
          </View>

          {/* Coming Soon Section for Rewards/Offers */}
          <View style={styles.comingSoonSection}>
            <View style={styles.comingSoonCard}>
              <Ionicons name="gift-outline" size={48} color={colors.primary} />
              <Text style={styles.comingSoonTitle}>Rewards & Offers</Text>
              <Text style={styles.comingSoonDescription}>
                Amazing rewards and exclusive offers are coming soon! 
                Redeem your Detoxcoins for gadgets, subscriptions, and more.
              </Text>
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonBadgeText}>COMING SOON</Text>
              </View>
            </View>
          </View>


          {/* Mockup Preview (Hidden - for development reference) */}
          {__DEV__ && false && (
            <View style={styles.mockupSection}>
              <Text style={styles.mockupTitle}>Developer Preview</Text>
              <Text style={styles.mockupDescription}>
                This section contains mockup reward cards for easy reproduction when implementing real rewards.
                Set the condition above to 'true' to view mockup cards.
              </Text>
              
              {/* 
                TODO: When implementing real rewards, restore the following:
                
                1. Import RewardCard component
                2. Add reward state management
                3. Add category filtering
                4. Add search functionality
                5. Add redemption modals
                
                Example reward structure:
                {
                  id: 'reward-id',
                  title: 'Reward Title',
                  description: 'Reward description',
                  subtext: 'Additional info',
                  detoxcoins: 10,
                  discount: '50% OFF',
                  category: 'Category',
                  image: 'image-url',
                  expiresAt: '2024-12-31',
                  usesLeft: 1
                }
              */}
            </View>
          )}
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
    ...typography.h1,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  comingSoonSection: {
    marginBottom: spacing.xl,
  },
  comingSoonCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  comingSoonTitle: {
    ...typography.h2,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  comingSoonDescription: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  comingSoonBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
  },
  comingSoonBadgeText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '700',
    fontSize: 12,
  },
  mockupSection: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#FFC107',
  },
  mockupTitle: {
    ...typography.h3,
    color: '#FFC107',
    marginBottom: spacing.sm,
  },
  mockupDescription: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});

export default MarketScreen;