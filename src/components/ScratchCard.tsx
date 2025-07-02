import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Image,
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
  onPurchaseAndWatchAd: () => Promise<boolean>; // Returns true if both purchase and ad watching were successful
  onReplay: () => void; // Called when user wants to play again
  disabled?: boolean;
  userBalance: number; // Current user balance for display
}

const ScratchCard: React.FC<ScratchCardProps> = ({ 
  onRewardRevealed, 
  onPurchaseAndWatchAd,
  onReplay,
  disabled = false,
  userBalance
}) => {
  const [isScratching, setIsScratching] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [reward, setReward] = useState<ScratchReward | null>(null);
  const [scratchProgress, setScratchProgress] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(1));
  const [rewardAnim] = useState(new Animated.Value(0));
  const [showReward, setShowReward] = useState(false);
  const [currentStep, setCurrentStep] = useState<'ready' | 'purchasing' | 'watching_ad' | 'scratching'>('ready');

  const SCRATCH_CARD_COST = 5;

  // Generate reward with updated odds (1 in 1500 for gift cards)
  const generateReward = (): ScratchReward => {
    const random = Math.random();
    
    // 1 in 1500 chance for Amazon gift cards (0.067% chance)
    if (random < (1 / 1500)) {
      const amounts = [5, 10, 15, 20];
      const amount = amounts[Math.floor(Math.random() * amounts.length)];
      return {
        type: 'amazon',
        amount,
        displayText: `$${amount} Amazon Gift Card`
      };
    }
    // Everything else is Digicoins (99.933% chance)
    else {
      const amounts = [1, 2, 3, 5, 8, 10];
      const amount = amounts[Math.floor(Math.random() * amounts.length)];
      return {
        type: 'digicoin',
        amount,
        displayText: `${amount} Digicoins`
      };
    }
  };

  const handlePurchaseAndPlay = async () => {
    if (disabled || isScratching || userBalance < SCRATCH_CARD_COST) return;

    try {
      // Show purchasing state
      setIsScratching(true);
      setCurrentStep('purchasing');
      setScratchProgress(10);
      setShowReward(false);

      // Handle purchase and ad watching
      const success = await onPurchaseAndWatchAd();
      if (!success) {
        setIsScratching(false);
        setScratchProgress(0);
        setCurrentStep('ready');
        return; // Purchase failed or ad was skipped
      }

      // Move to scratching phase
      setCurrentStep('scratching');
      setScratchProgress(30);

      // Generate reward after successful purchase and ad
      const newReward = generateReward();
      setReward(newReward);

      // Continue with scratching animation
      const scratchInterval = setInterval(() => {
        setScratchProgress(prev => {
          const newProgress = prev + 10;
          if (newProgress >= 100) {
            clearInterval(scratchInterval);
            setIsScratching(false);
            setIsRevealed(true);
            setShowReward(true);
            setCurrentStep('ready');
            onRewardRevealed(newReward);
            
            // Animate reward reveal
            Animated.spring(rewardAnim, {
              toValue: 1,
              friction: 8,
              tension: 40,
              useNativeDriver: true,
            }).start();

            // Auto-hide reward after 3 seconds and reset for next play
            setTimeout(() => {
              Animated.timing(rewardAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
              }).start(() => {
                setShowReward(false);
                setIsRevealed(false);
                setReward(null);
                setScratchProgress(0);
              });
            }, 3000);
          }
          return newProgress;
        });
      }, 100);

    } catch (error) {
      setIsScratching(false);
      setScratchProgress(0);
      setCurrentStep('ready');
      Alert.alert('Error', 'Failed to process scratch card. Please try again.');
    }
  };

  const handlePlayAgain = () => {
    // Immediately reset for next play
    setShowReward(false);
    setIsRevealed(false);
    setReward(null);
    setScratchProgress(0);
    setIsScratching(false);
    setCurrentStep('ready');
    
    // Reset animations
    rewardAnim.setValue(0);
    
    // Call parent replay handler
    onReplay();
  };

  const getButtonText = () => {
    switch (currentStep) {
      case 'purchasing':
        return 'Processing Payment...';
      case 'watching_ad':
        return 'Loading Ad...';
      case 'scratching':
        return 'Scratching...';
      default:
        return userBalance < SCRATCH_CARD_COST ? 'Insufficient Balance' : 'Pay 5 Digicoins & Watch Ad';
    }
  };

  const getSubText = () => {
    if (userBalance < SCRATCH_CARD_COST) {
      return `Need ${SCRATCH_CARD_COST - userBalance} more Digicoins`;
    }
    return '5 Digicoins + Ad Required';
  };

  const renderScratchSurface = () => (
    <View style={styles.scratchSurface}>
      <LinearGradient
        colors={[colors.primary, '#8B7EFF']}
        style={styles.scratchGradient}
      >
        <TouchableOpacity 
          style={[
            styles.scratchContent,
            (disabled || isScratching || userBalance < SCRATCH_CARD_COST) && styles.disabledButton
          ]}
          onPress={handlePurchaseAndPlay}
          disabled={disabled || isScratching || userBalance < SCRATCH_CARD_COST}
          activeOpacity={0.8}
        >
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/logo.png')}
              style={styles.digiLogo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.scratchText}>
            {getButtonText()}
          </Text>
          <Text style={styles.scratchSubtext}>{getSubText()}</Text>
          
          {isScratching && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${scratchProgress}%` }]} />
              </View>
              <Text style={styles.progressText}>
                {scratchProgress < 30 ? getButtonText() : `${scratchProgress}%`}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );

  const renderRewardOverlay = () => {
    if (!reward || !showReward) return null;

    return (
      <Animated.View 
        style={[
          styles.rewardOverlay,
          {
            opacity: rewardAnim,
            transform: [{ scale: rewardAnim }]
          }
        ]}
      >
        <LinearGradient
          colors={reward.type === 'digicoin' ? [colors.primary, '#8B7EFF'] : ['#FF6B35', '#F7931E']}
          style={styles.rewardGradient}
        >
          <View style={styles.rewardContent}>
            {reward.type === 'digicoin' ? (
              <Image
                source={require('../assets/logo.png')}
                style={styles.rewardLogo}
                resizeMode="contain"
              />
            ) : (
              <Text style={styles.giftIcon}>🎁</Text>
            )}
            <Text style={styles.rewardTitle}>You Won!</Text>
            <Text style={styles.rewardAmount}>{reward.displayText}</Text>
            {reward.type === 'amazon' && (
              <Text style={styles.rewardNote}>
                Gift card code will be sent to your email
              </Text>
            )}
            
            {/* Play Again Button */}
            <TouchableOpacity 
              style={styles.playAgainButton}
              onPress={handlePlayAgain}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={20} color={colors.text} />
              <Text style={styles.playAgainButtonText}>Play Again</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, disabled && styles.disabledContainer]}>
      {renderScratchSurface()}
      {renderRewardOverlay()}
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
    zIndex: 1,
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
  disabledButton: {
    opacity: 0.6,
  },
  logoContainer: {
    marginBottom: spacing.sm,
  },
  digiLogo: {
    width: 50,
    height: 50,
  },
  scratchText: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
    fontSize: 16,
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
  rewardOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
  rewardLogo: {
    width: 60,
    height: 60,
  },
  giftIcon: {
    fontSize: 50,
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
    marginBottom: spacing.md,
  },
  rewardNote: {
    ...typography.caption,
    color: colors.text,
    opacity: 0.8,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  playAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  playAgainButtonText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
});

export default ScratchCard; 