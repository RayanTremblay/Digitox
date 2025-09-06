import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import Header from '../components/Header';
import ScratchCard, { ScratchReward } from '../components/ScratchCard';
import RewardModal from '../components/RewardModal';
import { purchaseScratchCard, processReward, getScratchCardCost } from '../utils/scratchCardManager';
import { useBalance } from '../contexts/BalanceContext';
import { getDetoxcoinsBalance } from '../utils/storage';
import adManager from '../utils/adManager';
import { useAuth } from '../contexts/AuthContext';

const RewardsScreen = () => {
  const { user } = useAuth();
  const { balance, refreshBalance } = useBalance();
  const [isLoading, setIsLoading] = useState(false);
  const [scratchCardKey, setScratchCardKey] = useState(0);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [rewardData, setRewardData] = useState<{
    title: string;
    message: string;
    rewardAmount?: number;
    rewardType?: 'detoxcoin' | 'gift' | 'boost';
    newBalance?: number;
  }>({
    title: '',
    message: '',
  });

  const SCRATCH_CARD_COST = 5;

  // Reload balance when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      refreshBalance();
    }, [refreshBalance])
  );

  const handlePurchaseAndWatchAd = async (): Promise<boolean> => {
    if (isLoading) return false;

    setIsLoading(true);
    
    try {
      // Check if user has enough balance
      if (balance < SCRATCH_CARD_COST) {
        Alert.alert(
          'Insufficient Balance',
          `You need ${SCRATCH_CARD_COST} Detoxcoins to purchase a scratch card. You currently have ${balance.toFixed(2)} Detoxcoins.`,
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

      // Refresh balance after purchase
      await refreshBalance();

      // Then, show the ad
      const adResult = await adManager.showRewardedAd();
      
      if (!adResult.success) {
        Alert.alert(
          'Ad Required',
          'You need to watch the full ad to complete your scratch card purchase. Your 5 Detoxcoins have been refunded.',
          [{ text: 'OK' }]
        );
        
        // Refresh balance to show refund
        await refreshBalance();
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
          // Refresh balance to get updated amount
          await refreshBalance();
          
          // Get the actual updated balance from storage
          const updatedBalance = await getDetoxcoinsBalance();
          
          // Show custom reward modal
          setRewardData({
            title: 'Congratulations!',
            message: `You won ${reward.displayText}!`,
            rewardAmount: reward.amount,
            rewardType: 'detoxcoin',
            newBalance: updatedBalance,
          });
          setShowRewardModal(true);
        } else {
          // Show custom gift card modal
          setRewardData({
            title: 'Amazing!',
            message: `You won a ${reward.displayText}! The gift card code will be sent to your email within 24 hours.`,
            rewardAmount: reward.amount,
            rewardType: 'gift',
          });
          setShowRewardModal(true);
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
              userBalance={balance}
            />
            
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

      {/* Custom Reward Modal */}
      <RewardModal
        visible={showRewardModal}
        onClose={() => setShowRewardModal(false)}
        title={rewardData.title}
        message={rewardData.message}
        rewardAmount={rewardData.rewardAmount}
        rewardType={rewardData.rewardType}
        newBalance={rewardData.newBalance}
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