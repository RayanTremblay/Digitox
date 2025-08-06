import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../theme/theme';
import { Achievement } from '../services/achievementService';
import { LinearGradient } from 'expo-linear-gradient';

interface AchievementModalProps {
  visible: boolean;
  achievement: Achievement | null;
  onClose: () => void;
}

const AchievementModal: React.FC<AchievementModalProps> = ({ 
  visible, 
  achievement, 
  onClose 
}) => {
  if (!achievement) return null;

  const getRarityColors = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common':
        return ['#4CAF50', '#66BB6A'];
      case 'rare':
        return ['#2196F3', '#42A5F5'];
      case 'epic':
        return ['#9C27B0', '#BA68C8'];
      case 'legendary':
        return ['#FF9800', '#FFB74D'];
      default:
        return ['#757575', '#9E9E9E'];
    }
  };

  const getRarityEmoji = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common':
        return '⭐';
      case 'rare':
        return '🌟';
      case 'epic':
        return '💫';
      case 'legendary':
        return '✨';
      default:
        return '⭐';
    }
  };

  const gradientColors = getRarityColors(achievement.rarity);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <LinearGradient
            colors={gradientColors}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.achievementHeader}>
                <Text style={styles.achievementTitle}>🏆 Achievement Unlocked!</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Achievement Content */}
            <View style={styles.content}>
              {/* Icon */}
              <View style={styles.iconContainer}>
                <Ionicons 
                  name={achievement.icon as any} 
                  size={48} 
                  color="#FFFFFF" 
                />
              </View>

              {/* Rarity Badge */}
              <View style={styles.rarityContainer}>
                <Text style={styles.rarityEmoji}>
                  {getRarityEmoji(achievement.rarity)}
                </Text>
                <Text style={styles.rarityText}>
                  {achievement.rarity.toUpperCase()}
                </Text>
              </View>

              {/* Title */}
              <Text style={styles.title}>
                {achievement.title}
              </Text>

              {/* Description */}
              <Text style={styles.description}>
                {achievement.description}
              </Text>

              {/* Reward */}
              {achievement.reward && (
                <View style={styles.rewardContainer}>
                  <View style={styles.rewardBadge}>
                    <Ionicons name="diamond" size={20} color="#FFD700" />
                    <Text style={styles.rewardText}>
                      +{achievement.reward.digicoins} Digicoins
                    </Text>
                  </View>
                  <Text style={styles.rewardTitle}>
                    {achievement.reward.title}
                  </Text>
                </View>
              )}

              {/* Action Button */}
              <TouchableOpacity style={styles.actionButton} onPress={onClose}>
                <Text style={styles.actionButtonText}>Awesome!</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  container: {
    width: '100%',
    maxWidth: 340,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  gradient: {
    padding: spacing.xl,
  },
  header: {
    marginBottom: spacing.lg,
  },
  achievementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  achievementTitle: {
    ...typography.h3,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 18,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    gap: spacing.md,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  rarityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    gap: spacing.xs,
  },
  rarityEmoji: {
    fontSize: 16,
  },
  rarityText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  title: {
    ...typography.h2,
    color: '#FFFFFF',
    fontWeight: '800',
    textAlign: 'center',
    fontSize: 24,
  },
  description: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
    marginHorizontal: spacing.sm,
  },
  rewardContainer: {
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    gap: spacing.sm,
  },
  rewardText: {
    ...typography.body,
    color: '#FFD700',
    fontWeight: '700',
    fontSize: 16,
  },
  rewardTitle: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.round,
    marginTop: spacing.lg,
    minWidth: 120,
  },
  actionButtonText: {
    ...typography.body,
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 16,
  },
});

export default AchievementModal;