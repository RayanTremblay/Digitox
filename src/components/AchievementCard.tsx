import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../theme/theme';
import { Achievement } from '../services/achievementService';
import { LinearGradient } from 'expo-linear-gradient';

interface AchievementCardProps {
  achievement: Achievement;
  onPress?: () => void;
  showProgress?: boolean;
}

const AchievementCard: React.FC<AchievementCardProps> = ({ 
  achievement, 
  onPress, 
  showProgress = true 
}) => {
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

  const getRarityTextColor = (rarity: Achievement['rarity']) => {
    return achievement.unlocked ? '#FFFFFF' : colors.textSecondary;
  };

  const formatTarget = (achievement: Achievement) => {
    const { criteria } = achievement;
    
    switch (criteria.type) {
      case 'totalTime':
        const hours = Math.floor(criteria.target / 60);
        const minutes = criteria.target % 60;
        if (hours > 0) {
          return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
        }
        return `${minutes}m`;
      
      case 'singleSession':
        if (criteria.target >= 60) {
          const sessionHours = Math.floor(criteria.target / 60);
          const sessionMinutes = criteria.target % 60;
          return sessionMinutes > 0 ? `${sessionHours}h ${sessionMinutes}m` : `${sessionHours}h`;
        }
        return `${criteria.target}m`;
      
      case 'dailyStreak':
        return `${criteria.target} days`;
      
      case 'balance':
      case 'totalEarned':
        return `${criteria.target} coins`;
      
      case 'sessionCount':
        return `${criteria.target} sessions`;
      
      default:
        return 'Complete';
    }
  };

  const gradientColors = getRarityColors(achievement.rarity);
  const isUnlocked = achievement.unlocked;

  return (
    <TouchableOpacity
      style={[styles.container, !isUnlocked && styles.lockedContainer]}
      onPress={onPress}
      disabled={!onPress}
    >
      <LinearGradient
        colors={isUnlocked ? gradientColors : ['#2A2A2A', '#1A1A1A']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          {/* Icon and Rarity Badge */}
          <View style={styles.header}>
            <View style={[styles.iconContainer, !isUnlocked && styles.lockedIconContainer]}>
              <Ionicons 
                name={achievement.icon as any} 
                size={24} 
                color={isUnlocked ? '#FFFFFF' : colors.textSecondary} 
              />
            </View>
            
            <View style={[
              styles.rarityBadge, 
              { backgroundColor: isUnlocked ? 'rgba(255,255,255,0.2)' : 'rgba(117,117,117,0.3)' }
            ]}>
              <Text style={[styles.rarityText, { color: getRarityTextColor(achievement.rarity) }]}>
                {achievement.rarity.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Title and Description */}
          <View style={styles.textContainer}>
            <Text style={[
              styles.title, 
              { color: isUnlocked ? '#FFFFFF' : colors.text }
            ]}>
              {achievement.title}
            </Text>
            
            <Text style={[
              styles.description, 
              { color: isUnlocked ? 'rgba(255,255,255,0.8)' : colors.textSecondary }
            ]}>
              {achievement.description}
            </Text>

            {/* Target/Requirement */}
            <Text style={[
              styles.target,
              { color: isUnlocked ? 'rgba(255,255,255,0.7)' : colors.textSecondary }
            ]}>
              Target: {formatTarget(achievement)}
            </Text>
          </View>

          {/* Progress Bar (for locked achievements) */}
          {!isUnlocked && showProgress && achievement.progress > 0 && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${achievement.progress}%`, backgroundColor: gradientColors[0] }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>{achievement.progress}%</Text>
            </View>
          )}

          {/* Reward */}
          {achievement.reward && (
            <View style={styles.rewardContainer}>
              <Ionicons name="diamond" size={14} color={isUnlocked ? '#FFD700' : colors.textSecondary} />
              <Text style={[
                styles.rewardText,
                { color: isUnlocked ? '#FFD700' : colors.textSecondary }
              ]}>
                +{achievement.reward.digicoins} Digicoins
              </Text>
            </View>
          )}

          {/* Unlocked Badge */}
          {isUnlocked && (
            <View style={styles.unlockedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.unlockedText}>
                {achievement.unlockedAt ? 
                  `Unlocked ${achievement.unlockedAt.toLocaleDateString()}` : 
                  'Unlocked'
                }
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  lockedContainer: {
    opacity: 0.8,
  },
  gradient: {
    padding: spacing.lg,
  },
  content: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockedIconContainer: {
    backgroundColor: 'rgba(117,117,117,0.3)',
  },
  rarityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  rarityText: {
    ...typography.caption,
    fontWeight: '600',
    fontSize: 10,
  },
  textContainer: {
    gap: spacing.xs,
  },
  title: {
    ...typography.h3,
    fontWeight: '700',
    fontSize: 18,
  },
  description: {
    ...typography.body,
    lineHeight: 20,
  },
  target: {
    ...typography.caption,
    fontSize: 12,
    fontStyle: 'italic',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(117,117,117,0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
    minWidth: 35,
    textAlign: 'right',
  },
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  rewardText: {
    ...typography.caption,
    fontWeight: '600',
    fontSize: 12,
  },
  unlockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  unlockedText: {
    ...typography.caption,
    color: '#4CAF50',
    fontWeight: '600',
    fontSize: 11,
  },
});

export default AchievementCard;