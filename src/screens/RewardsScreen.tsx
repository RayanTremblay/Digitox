import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Header from '../components/Header';
import ScratchCard, { ScratchReward } from '../components/ScratchCard';
import { purchaseScratchCard, processReward, getScratchCardCost } from '../utils/scratchCardManager';
import { getDigicoinsBalance } from '../utils/storage';

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

  const handleScratchCardPurchase = async (): Promise<boolean> => {
    if (isLoading) return false;

    setIsLoading(true);
    
    try {
      const cost = getScratchCardCost();
      
      if (userBalance < cost) {
        Alert.alert(
          'Insufficient Balance',
          `You need ${cost} Digicoins to purchase a scratch card. You currently have ${userBalance.toFixed(2)} Digicoins.`,
          [{ text: 'OK' }]
        );
        return false;
      }

      const success = await purchaseScratchCard();
      
      if (success) {
        // Update local balance immediately
        setUserBalance(prev => prev - cost);
        return true;
      } else {
        Alert.alert('Error', 'Failed to purchase scratch card. Please try again.');
        return false;
      }
    } catch (error) {
      console.error('Error purchasing scratch card:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
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
            [
              {
                text: 'Play Again',
                onPress: () => {
                  setScratchCardKey(prev => prev + 1); // Reset scratch card
                }
              },
              { text: 'OK' }
            ]
          );
        } else {
          Alert.alert(
            'Amazing! 🎁',
            `You won a ${reward.displayText}! The gift card code will be sent to your email within 24 hours.`,
            [
              {
                text: 'Play Again',
                onPress: () => {
                  setScratchCardKey(prev => prev + 1); // Reset scratch card
                }
              },
              { text: 'OK' }
            ]
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
              onPurchase={handleScratchCardPurchase}
              disabled={isLoading || userBalance < getScratchCardCost()}
            />
            
            <View style={styles.scratchCardInfo}>
              <Text style={styles.infoText}>
                💎 Cost: {getScratchCardCost()} Digicoins
              </Text>
              <Text style={styles.infoText}>
                💰 Your Balance: {userBalance.toFixed(2)} Digicoins
              </Text>
              <Text style={styles.infoSubtext}>
                Win Digicoins (70% chance) or Amazon Gift Cards up to $20 (30% chance)
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Draw</Text>

          <View style={styles.drawCard}>
            <View style={styles.drawContent}>
              <View>
                <View style={styles.drawHeader}>
                  <Image
                    source={require('../assets/logo.png')}
                    style={styles.rewardIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.rewardValue}>+2.00</Text>
                </View>
                <Text style={styles.drawTitle}>Macbook M4 Pro</Text>
                <Text style={styles.drawDescription}>Buy tickets to get the chance to win a Macbook M4 Pro</Text>
                <TouchableOpacity style={styles.drawButton}>
                  <Text style={styles.drawButtonText}>Enter Draw</Text>
                </TouchableOpacity>
                <Text style={styles.timeLeft}>05h:04m:40s</Text>
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
  rewardIcon: {
    width: 24,
    height: 24,
    marginRight: spacing.xs,
  },
  rewardValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  drawCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },
  drawContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  drawHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  drawTitle: {
    ...typography.h3,
    marginBottom: spacing.sm,
  },
  drawDescription: {
    ...typography.body,
    marginBottom: spacing.lg,
  },
  drawButton: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  drawButtonText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  timeLeft: {
    ...typography.caption,
  },
  productImage: {
    width: 120,
    height: 120,
    marginLeft: spacing.lg,
  },
});

export default RewardsScreen; 