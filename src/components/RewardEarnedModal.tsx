import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, Image } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';

interface RewardEarnedModalProps {
  visible: boolean;
  onClose: () => void;
  rewardAmount: number;
  rewardType?: 'digicoin' | 'ticket' | 'scratch_card';
  title?: string;
  subtitle?: string;
}

const RewardEarnedModal: React.FC<RewardEarnedModalProps> = ({
  visible,
  onClose,
  rewardAmount,
  rewardType = 'digicoin',
  title,
  subtitle,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto close after 3 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      // Reset animations
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const getRewardIcon = () => {
    switch (rewardType) {
      case 'digicoin':
        return require('../assets/logo.png');
      case 'ticket':
        return require('../assets/logo.png'); // You can add a ticket icon later
      case 'scratch_card':
        return require('../assets/logo.png'); // You can add a scratch card icon later
      default:
        return require('../assets/logo.png');
    }
  };

  const getRewardText = () => {
    switch (rewardType) {
      case 'digicoin':
        return rewardAmount === 1 ? 'Digicoin' : 'Digicoins';
      case 'ticket':
        return rewardAmount === 1 ? 'Ticket' : 'Tickets';
      case 'scratch_card':
        return rewardAmount === 1 ? 'Scratch Card' : 'Scratch Cards';
      default:
        return 'Reward';
    }
  };

  const getDefaultTitle = () => {
    switch (rewardType) {
      case 'digicoin':
        return 'Digicoins Earned! 🎉';
      case 'ticket':
        return 'Tickets Earned! 🎟️';
      case 'scratch_card':
        return 'Scratch Card Earned! 🎁';
      default:
        return 'Reward Earned! 🎉';
    }
  };

  const getDefaultSubtitle = () => {
    switch (rewardType) {
      case 'digicoin':
        return 'Great job watching the ad!';
      case 'ticket':
        return 'You earned free tickets!';
      case 'scratch_card':
        return 'Time to scratch and win!';
      default:
        return 'Thanks for watching!';
    }
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={['#8B5CF6', '#A855F7', '#C084FC']}
            style={styles.modalContent}
          >
            <View style={styles.iconContainer}>
              <Image
                source={getRewardIcon()}
                style={styles.rewardIcon}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.title}>
              {title || getDefaultTitle()}
            </Text>

            <Text style={styles.subtitle}>
              {subtitle || getDefaultSubtitle()}
            </Text>

            <View style={styles.rewardContainer}>
              <Text style={styles.rewardAmount}>{rewardAmount}</Text>
              <Text style={styles.rewardText}>{getRewardText()}</Text>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              activeOpacity={0.8}
            >
              <Text style={styles.closeButtonText}>Awesome!</Text>
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
  },
  modalContainer: {
    width: '85%',
    maxWidth: 350,
  },
  modalContent: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  rewardIcon: {
    width: 50,
    height: 50,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
    fontWeight: '700',
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    opacity: 0.9,
  },
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.xl,
  },
  rewardAmount: {
    ...typography.h1,
    color: colors.text,
    fontWeight: '800',
    marginRight: spacing.xs,
  },
  rewardText: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  closeButtonText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
});

export default RewardEarnedModal;