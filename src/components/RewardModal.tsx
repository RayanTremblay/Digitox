import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';
import logo from '../assets/logo.png';

interface RewardModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  rewardAmount?: number;
  rewardType?: 'detoxcoin' | 'gift' | 'boost';
  newBalance?: number;
}

const RewardModal: React.FC<RewardModalProps> = ({
  visible,
  onClose,
  title,
  message,
  rewardAmount,
  rewardType = 'detoxcoin',
  newBalance
}) => {
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const getRewardIcon = () => {
    switch (rewardType) {
      case 'detoxcoin':
        return 'diamond';
      case 'gift':
        return 'gift';
      case 'boost':
        return 'flash';
      default:
        return 'trophy';
    }
  };

  const getRewardColor = () => {
    switch (rewardType) {
      case 'detoxcoin':
        return '#6C63FF';
      case 'gift':
        return '#FF6B6B';
      case 'boost':
        return '#FF9500';
      default:
        return '#6C63FF';
    }
  };

  const getRewardGradient = (): [string, string] => {
    switch (rewardType) {
      case 'detoxcoin':
        return ['#6C63FF', '#9C88FF'];
      case 'gift':
        return ['#FF6B6B', '#FF8A80'];
      case 'boost':
        return ['#FF9500', '#FFB74D'];
      default:
        return ['#6C63FF', '#9C88FF'];
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        <Animated.View 
          style={[
            styles.container, 
            { 
              transform: [{ scale: scaleAnim }] 
            }
          ]}
        >
          <LinearGradient
            colors={getRewardGradient()}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Close button */}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Reward icon */}
            <View style={styles.iconContainer}>
              {rewardType === 'detoxcoin' ? (
                <Image 
                  source={logo} 
                  style={styles.logoImage} 
                  resizeMode="cover" 
                />
              ) : (
                <Ionicons 
                  name={getRewardIcon()} 
                  size={60} 
                  color="#FFFFFF" 
                />
              )}
            </View>

            {/* Title */}
            <Text style={styles.title}>{title}</Text>

            {/* Message */}
            <Text style={styles.message}>{message}</Text>

            {/* Reward amount */}
            {rewardAmount && (
              <View style={styles.rewardContainer}>
                <Text style={styles.rewardAmount}>+{rewardAmount}</Text>
                <Text style={styles.rewardLabel}>
                  {rewardType === 'detoxcoin' ? 'Detoxcoins' : 
                   rewardType === 'gift' ? 'Gift Card' : 
                   rewardType === 'boost' ? 'Boost' : 'Reward'}
                </Text>
              </View>
            )}

            {/* New balance */}
            {newBalance !== undefined && rewardType === 'detoxcoin' && (
              <View style={styles.balanceContainer}>
                <Text style={styles.balanceLabel}>New Balance:</Text>
                <Text style={styles.balanceAmount}>{newBalance.toFixed(2)} Detoxcoins</Text>
              </View>
            )}

            {/* Action button */}
            <TouchableOpacity style={styles.actionButton} onPress={onClose}>
              <Text style={styles.actionButtonText}>
                {rewardType === 'gift' ? 'Incredible!' : 'Awesome!'}
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  container: {
    width: '100%',
    maxWidth: 350,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  gradient: {
    padding: spacing.xl,
    alignItems: 'center',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  logoImage: {
    width: 120,
    height: 120,
  },
  title: {
    ...typography.h2,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 24,
  },
  rewardContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingVertical: spacing.sm,
    minHeight: 80,
    justifyContent: 'center',
  },
  rewardAmount: {
    ...typography.h1,
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    lineHeight: 56,
    textAlign: 'center',
  },
  rewardLabel: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  balanceContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.md,
  },
  balanceLabel: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: spacing.xs,
  },
  balanceAmount: {
    ...typography.h3,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  actionButtonText: {
    ...typography.button,
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
});

export default RewardModal;