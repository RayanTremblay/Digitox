import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';
import achievementService, { AchievementStats } from '../services/achievementService';

interface AchievementPreviewProps {
  onPress?: () => void;
}

const AchievementPreview: React.FC<AchievementPreviewProps> = ({ onPress }) => {
  const [stats, setStats] = useState<AchievementStats | null>(null);

  useEffect(() => {
    loadAchievementStats();
  }, []);

  const loadAchievementStats = async () => {
    try {
      const achievementStats = achievementService.getAchievementStats();
      setStats(achievementStats);
    } catch (error) {
      console.error('Error loading achievement stats:', error);
    }
  };

  if (!stats) return null;

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 80) return '#4CAF50';
    if (percentage >= 60) return '#FF9800';
    if (percentage >= 40) return '#2196F3';
    return '#9E9E9E';
  };

  const recentAchievement = stats.recentUnlocks[0];
  const nextAchievement = stats.nextToUnlock[0];

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <LinearGradient
        colors={[colors.surface, '#2A2A2A']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Ionicons name="trophy" size={20} color={colors.primary} />
            <Text style={styles.title}>Achievements</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </View>

        <View style={styles.content}>
          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <Text style={styles.progressLabel}>
              {stats.totalUnlocked} / {stats.totalPossible} unlocked
            </Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${stats.completionPercentage}%`,
                    backgroundColor: getCompletionColor(stats.completionPercentage)
                  }
                ]} 
              />
            </View>
            <Text style={[styles.progressPercentage, { color: getCompletionColor(stats.completionPercentage) }]}>
              {stats.completionPercentage}%
            </Text>
          </View>

          {/* Achievement Info */}
          <View style={styles.achievementInfo}>
            {recentAchievement ? (
              <View style={styles.achievementItem}>
                <Text style={styles.achievementLabel}>Latest:</Text>
                <Text style={styles.achievementText} numberOfLines={1}>
                  {recentAchievement.title}
                </Text>
              </View>
            ) : nextAchievement ? (
              <View style={styles.achievementItem}>
                <Text style={styles.achievementLabel}>Next:</Text>
                <Text style={styles.achievementText} numberOfLines={1}>
                  {nextAchievement.title} ({nextAchievement.progress}%)
                </Text>
              </View>
            ) : (
              <View style={styles.achievementItem}>
                <Text style={styles.achievementLabel}>No achievements yet</Text>
                <Text style={styles.achievementText}>
                  Start your journey to unlock achievements!
                </Text>
              </View>
            )}
          </View>
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
  },
  gradient: {
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...typography.h3,
    color: colors.text,
    fontSize: 16,
  },
  content: {
    gap: spacing.sm,
  },
  progressContainer: {
    gap: spacing.xs,
  },
  progressLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.background,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressPercentage: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '600',
    alignSelf: 'flex-end',
  },
  achievementInfo: {
    marginTop: spacing.xs,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  achievementLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
    minWidth: 50,
  },
  achievementText: {
    ...typography.caption,
    color: colors.text,
    fontSize: 12,
    flex: 1,
  },
});

export default AchievementPreview;