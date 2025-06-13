import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export interface ScratchReward {
  type: 'digicoin' | 'amazon';
  amount: number;
  displayText: string;
}

interface ScratchCardProps {
  onRewardRevealed: (reward: ScratchReward) => void;
  onPurchase: () => Promise<boolean>; // Returns true if purchase successful
  disabled?: boolean;
}

const ScratchCard: React.FC<ScratchCardProps> = ({ onRewardRevealed, onPurchase, disabled = false }) => {
  const [isScratching, setIsScratching] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [reward, setReward] = useState<ScratchReward | null>(null);
  const [scratchProgress, setScratchProgress] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(1));

  // Generate reward with weighted odds
  const generateReward = (): ScratchReward => {
    const random = Math.random();
    
    // 70% chance for Digicoins (more frequent)
    if (random < 0.7) {
      const amounts = [1, 2, 3, 5, 8, 10];
      const amount = amounts[Math.floor(Math.random() * amounts.length)];
      return {
        type: 'digicoin',
        amount,
        displayText: `${amount} Digicoins`
      };
    }
    // 30% chance for Amazon gift cards (less frequent, higher value)
    else {
      const amounts = [5, 10, 15, 20];
      const amount = amounts[Math.floor(Math.random() * amounts.length)];
      return {
        type: 'amazon',
        amount,
        displayText: `$${amount} Amazon Gift Card`
      };
    }
  };

  const handlePurchaseAndScratch = async () => {
    if (disabled || isRevealed) return;

    try {
      const purchaseSuccess = await onPurchase();
      if (!purchaseSuccess) {
        return; // Purchase failed, don't proceed
      }

      // Generate reward after successful purchase
      const newReward = generateReward();
      setReward(newReward);
      setIsScratching(true);

      // Simulate scratching animation
      const scratchInterval = setInterval(() => {
        setScratchProgress(prev => {
          const newProgress = prev + 10;
          if (newProgress >= 100) {
            clearInterval(scratchInterval);
            setIsScratching(false);
            setIsRevealed(true);
            onRewardRevealed(newReward);
            
            // Fade out scratch surface
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }).start();
          }
          return newProgress;
        });
      }, 100);

    } catch (error) {
      Alert.alert('Error', 'Failed to purchase scratch card. Please try again.');
    }
  };

  const renderScratchSurface = () => (
    <Animated.View style={[styles.scratchSurface, { opacity: fadeAnim }]}>
      <LinearGradient
        colors={[colors.primary, '#8B7EFF']}
        style={styles.scratchGradient}
      >
        <TouchableOpacity 
          style={styles.scratchContent}
          onPress={handlePurchaseAndScratch}
          disabled={disabled || isScratching || isRevealed}
          activeOpacity={0.8}
        >
          <View style={styles.logoContainer}>
            <Ionicons name="diamond" size={40} color={colors.text} />
          </View>
          <Text style={styles.scratchText}>
            {isScratching ? 'Scratching...' : 'Tap to Scratch!'}
          </Text>
          <Text style={styles.scratchSubtext}>5 Digicoins</Text>
          
          {isScratching && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${scratchProgress}%` }]} />
              </View>
              <Text style={styles.progressText}>{scratchProgress}%</Text>
            </View>
          )}
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );

  const renderReward = () => {
    if (!reward || !isRevealed) return null;

    return (
      <View style={styles.rewardContainer}>
        <LinearGradient
          colors={reward.type === 'digicoin' ? [colors.primary, '#8B7EFF'] : ['#FF6B35', '#F7931E']}
          style={styles.rewardGradient}
        >
          <View style={styles.rewardContent}>
            <Ionicons 
              name={reward.type === 'digicoin' ? 'diamond' : 'gift'} 
              size={50} 
              color={colors.text} 
            />
            <Text style={styles.rewardTitle}>Congratulations!</Text>
            <Text style={styles.rewardAmount}>{reward.displayText}</Text>
            {reward.type === 'amazon' && (
              <Text style={styles.rewardNote}>
                Gift card code will be sent to your email
              </Text>
            )}
          </View>
        </LinearGradient>
      </View>
    );
  };

  return (
    <View style={[styles.container, disabled && styles.disabledContainer]}>
      {!isRevealed && renderScratchSurface()}
      {isRevealed && renderReward()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    position: 'relative',
  },
  disabledContainer: {
    opacity: 0.5,
  },
  scratchSurface: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  scratchGradient: {
    flex: 1,
  },
  scratchContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  logoContainer: {
    marginBottom: spacing.sm,
  },
  scratchText: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  scratchSubtext: {
    ...typography.caption,
    color: colors.text,
    opacity: 0.8,
    textAlign: 'center',
  },
  progressContainer: {
    marginTop: spacing.md,
    alignItems: 'center',
    width: '80%',
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.text,
    borderRadius: 3,
  },
  progressText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  rewardContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  rewardGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  rewardContent: {
    alignItems: 'center',
  },
  rewardTitle: {
    ...typography.h2,
    color: colors.text,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  rewardAmount: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  rewardNote: {
    ...typography.caption,
    color: colors.text,
    opacity: 0.8,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});

export default ScratchCard; 