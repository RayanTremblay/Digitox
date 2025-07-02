import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Header from '../components/Header';
import ScratchCard, { ScratchReward } from '../components/ScratchCard';
import DrawCard from '../components/DrawCard';
import { purchaseScratchCard, processReward, getScratchCardCost } from '../utils/scratchCardManager';
import { getDigicoinsBalance } from '../utils/storage';
import adManager from '../utils/adManager';

type RootStackParamList = {
  MainTabs: undefined;
  Profile: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

const RewardsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [userBalance, setUserBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [scratchCardKey, setScratchCardKey] = useState(0); // For resetting scratch card

  const SCRATCH_CARD_COST = 5;

  // Load user balance
  const loadUserBalance = async () => {
    try {
      const balance = await getDigicoinsBalance();
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
          `You need ${SCRATCH_CARD_COST} Digicoins to purchase a scratch card. You currently have ${userBalance.toFixed(2)} Digicoins.`,
          [{ text: 'OK' }]
        );
        return false;
      }

      // First, purchase the scratch card (deduct 5 Digicoins)
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
          'You need to watch the full ad to complete your scratch card purchase. Your 5 Digicoins have been refunded.',
          [{ text: 'OK' }]
        );
        
        // Refund the Digicoins since ad wasn't watched
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
      const success = await processReward(reward);
      
      if (success) {
        if (reward.type === 'digicoin') {
          // Update local balance for Digicoins
          setUserBalance(prev => prev + reward.amount);
          
          Alert.alert(
            'Congratulations! 🎉',
            `You won ${reward.displayText}! Your new balance is ${(userBalance + reward.amount).toFixed(2)} Digicoins.`,
            [{ text: 'Awesome!' }]
          );
        } else {
          Alert.alert(
            'Amazing! 🎁',
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
            <Text style={styles.title}>Rewards</Text>
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
                Cost: {SCRATCH_CARD_COST} Digicoins + Ad
              </Text>
              <Text style={styles.infoText}>
                Your Balance: {userBalance.toFixed(2)} Digicoins
              </Text>
              <Text style={styles.infoSubtext}>
                Pay {SCRATCH_CARD_COST} Digicoins and watch an ad to play • Win Digicoins or Amazon Gift Cards up to $20!
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Draw</Text>

          <DrawCard
            userBalance={userBalance}
            onBalanceUpdate={loadUserBalance}
          />
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

});

export default RewardsScreen; 