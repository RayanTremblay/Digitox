import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import Header from '../components/Header';
import ScratchCard, { ScratchReward } from '../components/ScratchCard';
import { purchaseScratchCard, processReward, getScratchCardCost } from '../utils/scratchCardManager';
import { getDetoxcoinsBalance } from '../utils/storage';
import adManager from '../utils/adManager';
import { useAuth } from '../contexts/AuthContext';

const RewardsScreen = () => {
  const { user } = useAuth();
  const [userBalance, setUserBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [scratchCardKey, setScratchCardKey] = useState(0);

  const SCRATCH_CARD_COST = 5;

  // Load user balance
  const loadUserBalance = async () => {
    try {
      const balance = await getDetoxcoinsBalance();
      setUserBalance(balance);
    } catch (error) {
      console.error('Error loading user balance:', error);
    }
  };

  useEffect(() => {
    loadUserBalance();
  }, []);

  // Reload balance when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadUserBalance();
    }, [])
  );

  const handlePurchaseAndWatchAd = async (): Promise<boolean> => {
    if (isLoading) return false;

    setIsLoading(true);
    
    try {
      // Check if user has enough balance
      if (userBalance < SCRATCH_CARD_COST) {
        Alert.alert(
          'Insufficient Balance',
          `You need ${SCRATCH_CARD_COST} Detoxcoins to purchase a scratch card. You currently have ${userBalance.toFixed(2)} Detoxcoins.`,
          [{ text: 'OK' }]
        );
        return false;
      }

      // First, purchase the scratch card (deduct 5 Detoxcoins)
      const purchaseSuccess = await purchaseScratchCard();
      
      if (!purchaseSuccess) {
        Alert.alert('Error', 'Failed to purchase scratch card. Please try again.');
        return false;
      }

      // Update local balance immediately after purchase
      setUserBalance(prev => prev - SCRATCH_CARD_COST);

      // Then, show the ad
      const adResult = await adManager.showRewardedAd();
      
      if (!adResult.success) {
        Alert.alert(
          'Ad Required',
          'You need to watch the full ad to complete your scratch card purchase. Your 5 Detoxcoins have been refunded.',
          [{ text: 'OK' }]
        );
        
        // Refund the Detoxcoins since ad wasn't watched
        setUserBalance(prev => prev + SCRATCH_CARD_COST);
        return false;
      }

      // Preload next ad for better UX
      adManager.preloadAd();
      return true;

    } catch (error) {
      console.error('Error in purchase and ad flow:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleReplay = () => {
    // Preload ad for next play
    adManager.preloadAd();
  };

  const handleRewardRevealed = async (reward: ScratchReward) => {
    try {
      // Pass user info for gift card tracking
      const userInfo = {
        userId: user?.uid || user?.email || 'unknown',
        email: user?.email || 'unknown'
      };
      
      const success = await processReward(reward, userInfo);
      
      if (success) {
        if (reward.type === 'detoxcoin') {
          // Update local balance for Detoxcoins
          setUserBalance(prev => prev + reward.amount);
          
          Alert.alert(
            'Congratulations!',
            `You won ${reward.displayText}! Your new balance is ${(userBalance + reward.amount).toFixed(2)} Detoxcoins.`,
            [{ text: 'Awesome!' }]
          );
        } else {
          Alert.alert(
            'Amazing!',
            `You won a ${reward.displayText}! The gift card code will be sent to your email within 24 hours.`,
            [{ text: 'Incredible!' }]
          );
        }
      } else {
        Alert.alert('Error', 'Failed to process your reward. Please contact support.');
      }
    } catch (error) {
      console.error('Error processing reward:', error);
      Alert.alert('Error', 'An unexpected error occurred while processing your reward.');
    }
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
          <Header />
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Scratch & Win</Text>
            <Text style={styles.subtitle}>Try your luck with instant scratch cards</Text>
          </View>

          <Text style={styles.sectionTitle}>Scratch Cards</Text>
          
          <View style={styles.scratchCardContainer}>
            <ScratchCard
              key={scratchCardKey}
              onRewardRevealed={handleRewardRevealed}
              onPurchaseAndWatchAd={handlePurchaseAndWatchAd}
              onReplay={handleReplay}
              disabled={isLoading}
              userBalance={userBalance}
            />
            
            <View style={styles.scratchCardInfo}>
              <Text style={styles.infoText}>
                Cost: {SCRATCH_CARD_COST} Detoxcoins + Ad
              </Text>
              <Text style={styles.infoText}>
                Your Balance: {userBalance.toFixed(2)} Detoxcoins
              </Text>
              <Text style={styles.infoSubtext}>
                Pay {SCRATCH_CARD_COST} Detoxcoins and watch an ad to play • Win Detoxcoins or Amazon Gift Cards up to $20!
              </Text>
            </View>
          </View>

          {/* Coming Soon Section for Other Rewards */}
          <View style={styles.comingSoonSection}>
            <Text style={styles.sectionTitle}>More Rewards Coming Soon!</Text>
            <View style={styles.comingSoonCard}>
              <Text style={styles.comingSoonText}>
                Prize Draws{'\n'}
                Tournament Rewards{'\n'}
                Special Events{'\n'}
                Exclusive Offers
              </Text>
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonBadgeText}>COMING SOON</Text>
              </View>
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
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  scratchCardContainer: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },
  scratchCardInfo: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  infoText: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  infoSubtext: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  comingSoonSection: {
    marginHorizontal: spacing.md,
    marginTop: spacing.xl,
  },
  comingSoonCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  comingSoonText: {
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

});

export default RewardsScreen; 