import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme/theme';

export interface Reward {
  id: string;
  title: string;
  description: string;
  subtext: string;
  digicoins: number;
  discount: string;
  category: string;
  expiresAt: string;
  usesLeft: number;
  image: any;
}

interface RewardCardProps {
  reward: Reward;
  onRedeem?: () => void;
  onShowRedeemedCode?: () => void;
  showFooter?: boolean;
  showRedeemButton?: boolean;
  isRedeemed?: boolean;
}

const RewardCard = ({ 
  reward, 
  onRedeem,
  onShowRedeemedCode,
  showFooter = true,
  showRedeemButton = true,
  isRedeemed = false
}: RewardCardProps) => {
  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;

  // Entrance animation
  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Button press animation
  const handlePressIn = () => {
    Animated.spring(buttonScaleAnim, {
      toValue: 0.95,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScaleAnim, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View 
      style={[
        styles.rewardCard,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        }
      ]}
    >
      <View style={styles.rewardHeader}>
        <Image
          source={reward.image}
          style={styles.rewardIcon}
          resizeMode="contain"
        />
        <View style={styles.rewardInfo}>
          <Text style={styles.rewardValue}>{reward.digicoins} Digicoins</Text>
          <Text style={styles.rewardDiscount}>{reward.discount}</Text>
        </View>
      </View>
      <Text style={styles.rewardTitle}>{reward.title}</Text>
      <Text style={styles.rewardDescription}>{reward.description}</Text>
      <Text style={styles.rewardSubtext}>{reward.subtext}</Text>
      
      {showFooter && (
        <View style={styles.rewardFooter}>
          <Text style={styles.rewardExpiry}>Expires: {reward.expiresAt}</Text>
          <Text style={styles.rewardUses}>Uses left: {reward.usesLeft}</Text>
        </View>
      )}

      {showRedeemButton && (
        <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
          {isRedeemed ? (
            <TouchableOpacity 
              style={styles.redeemedButton}
              onPress={onShowRedeemedCode}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              activeOpacity={0.8}
            >
              <Text style={styles.redeemedButtonText}>✅ Already Redeemed</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.redeemButton}
              onPress={onRedeem}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              activeOpacity={0.8}
            >
              <Text style={styles.redeemButtonText}>Redeem</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  rewardCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.md,
    marginBottom: spacing.xl,
    shadowColor: colors.text,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rewardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  rewardIcon: {
    width: 24,
    height: 24,
    marginRight: spacing.sm,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  rewardDiscount: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  rewardTitle: {
    ...typography.h2,
    marginBottom: spacing.sm,
  },
  rewardDescription: {
    ...typography.body,
    marginBottom: spacing.xs,
  },
  rewardSubtext: {
    ...typography.caption,
    marginBottom: spacing.md,
  },
  rewardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  rewardExpiry: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  rewardUses: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  redeemButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
  },
  redeemButtonText: {
    ...typography.body,
    color: colors.background,
    fontWeight: '600',
  },
  redeemedButton: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.textSecondary,
  },
  redeemedButtonText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});

export default RewardCard; 