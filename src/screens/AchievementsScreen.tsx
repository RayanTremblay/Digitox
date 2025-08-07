import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import AchievementCard from '../components/AchievementCard';
import achievementService, { Achievement, AchievementStats } from '../services/achievementService';
import { RootStackParamList } from '../types/navigation';

type NavigationProp = StackNavigationProp<RootStackParamList>;

const CATEGORIES = [
  { id: 'all', name: 'All', icon: 'apps' },
  { id: 'time', name: 'Time', icon: 'time' },
  { id: 'streak', name: 'Streaks', icon: 'flame' },
  { id: 'balance', name: 'Coins', icon: 'diamond' },
  { id: 'sessions', name: 'Sessions', icon: 'play-circle' },
  { id: 'milestones', name: 'Milestones', icon: 'flag' },
  { id: 'special', name: 'Special', icon: 'star' },
] as const;

const AchievementsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<AchievementStats | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      await achievementService.initialize();
      const allAchievements = achievementService.getAchievements();
      const achievementStats = achievementService.getAchievementStats();
      
      setAchievements(allAchievements);
      setStats(achievementStats);
    } catch (error) {
      console.error('Error loading achievements:', error);
    }
  };

  const getFilteredAchievements = () => {
    if (selectedCategory === 'all') {
      return achievements;
    }
    return achievements.filter(a => a.category === selectedCategory);
  };

  const handleAchievementPress = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    setShowDetailModal(true);
  };

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 80) return '#4CAF50';
    if (percentage >= 60) return '#FF9800';
    if (percentage >= 40) return '#2196F3';
    return '#9E9E9E';
  };

  const getRarityIcon = (rarity: Achievement['rarity']) => {
    switch (rarity) {
              case 'common': return '';
      case 'rare': return '';
      case 'epic': return '';
      case 'legendary': return '';
      default: return '';
    }
  };

  const filteredAchievements = getFilteredAchievements();
  const unlockedInCategory = filteredAchievements.filter(a => a.unlocked).length;

  return (
    <LinearGradient colors={['#1D2024', '#6E7A8A']} style={styles.container}>
      <Header showBack={true} />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.headerSection}>
            <Text style={styles.title}>Achievements</Text>
            <Text style={styles.subtitle}>Track your digital detox milestones</Text>
          </View>

          {/* Overall Stats */}
          {stats && (
            <View style={styles.statsContainer}>
              <View style={styles.statsHeader}>
                <Text style={styles.statsTitle}>Your Progress</Text>
                <Text style={[styles.completionPercentage, { color: getCompletionColor(stats.completionPercentage) }]}>
                  {stats.completionPercentage}%
                </Text>
              </View>
              
              <View style={styles.progressBarContainer}>
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
                <Text style={styles.progressText}>
                  {stats.totalUnlocked} / {stats.totalPossible} unlocked
                </Text>
              </View>

              {/* Quick Stats */}
              <View style={styles.quickStats}>
                <View style={styles.quickStat}>
                  <Text style={styles.quickStatNumber}>{stats.totalUnlocked}</Text>
                  <Text style={styles.quickStatLabel}>Unlocked</Text>
                </View>
                <View style={styles.quickStat}>
                  <Text style={styles.quickStatNumber}>{stats.nextToUnlock.length}</Text>
                  <Text style={styles.quickStatLabel}>Almost There</Text>
                </View>
                <View style={styles.quickStat}>
                  <Text style={styles.quickStatNumber}>{stats.recentUnlocks.length}</Text>
                  <Text style={styles.quickStatLabel}>Recent</Text>
                </View>
              </View>
            </View>
          )}

          {/* Category Filter */}
          <View style={styles.categoryContainer}>
            <Text style={styles.categoryTitle}>Categories</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              <View style={styles.categoryButtons}>
                {CATEGORIES.map((category) => {
                  const isSelected = selectedCategory === category.id;
                  const categoryAchievements = category.id === 'all' 
                    ? achievements 
                    : achievements.filter(a => a.category === category.id);
                  const categoryUnlocked = categoryAchievements.filter(a => a.unlocked).length;
                  
                  return (
                    <TouchableOpacity
                      key={category.id}
                      style={[styles.categoryButton, isSelected && styles.selectedCategoryButton]}
                      onPress={() => setSelectedCategory(category.id)}
                    >
                      <Ionicons 
                        name={category.icon as any} 
                        size={20} 
                        color={isSelected ? colors.text : colors.textSecondary} 
                      />
                      <Text style={[
                        styles.categoryButtonText,
                        isSelected && styles.selectedCategoryButtonText
                      ]}>
                        {category.name}
                      </Text>
                      <Text style={[
                        styles.categoryCount,
                        isSelected && styles.selectedCategoryCount
                      ]}>
                        {categoryUnlocked}/{categoryAchievements.length}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          {/* Achievement List */}
          <View style={styles.achievementSection}>
            <View style={styles.achievementHeader}>
              <Text style={styles.achievementTitle}>
                {selectedCategory === 'all' ? 'All Achievements' : 
                 CATEGORIES.find(c => c.id === selectedCategory)?.name + ' Achievements'}
              </Text>
              <Text style={styles.achievementCount}>
                {unlockedInCategory} / {filteredAchievements.length}
              </Text>
            </View>

            {/* Unlocked Achievements */}
            {filteredAchievements.filter(a => a.unlocked).length > 0 && (
              <View style={styles.achievementGroup}>
                <Text style={styles.groupTitle}>Unlocked ({filteredAchievements.filter(a => a.unlocked).length})</Text>
                {filteredAchievements
                  .filter(a => a.unlocked)
                  .sort((a, b) => (b.unlockedAt?.getTime() || 0) - (a.unlockedAt?.getTime() || 0))
                  .map((achievement) => (
                    <AchievementCard
                      key={achievement.id}
                      achievement={achievement}
                      onPress={() => handleAchievementPress(achievement)}
                      showProgress={false}
                    />
                  ))}
              </View>
            )}

            {/* In Progress Achievements */}
            {filteredAchievements.filter(a => !a.unlocked && a.progress > 0).length > 0 && (
              <View style={styles.achievementGroup}>
                <Text style={styles.groupTitle}>⏳ In Progress ({filteredAchievements.filter(a => !a.unlocked && a.progress > 0).length})</Text>
                {filteredAchievements
                  .filter(a => !a.unlocked && a.progress > 0)
                  .sort((a, b) => b.progress - a.progress)
                  .map((achievement) => (
                    <AchievementCard
                      key={achievement.id}
                      achievement={achievement}
                      onPress={() => handleAchievementPress(achievement)}
                      showProgress={true}
                    />
                  ))}
              </View>
            )}

            {/* Locked Achievements */}
            {filteredAchievements.filter(a => !a.unlocked && a.progress === 0).length > 0 && (
              <View style={styles.achievementGroup}>
                <Text style={styles.groupTitle}>Locked ({filteredAchievements.filter(a => !a.unlocked && a.progress === 0).length})</Text>
                {filteredAchievements
                  .filter(a => !a.unlocked && a.progress === 0)
                  .sort((a, b) => {
                    // Sort by rarity (legendary first) then alphabetically
                    const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };
                    const rarityDiff = rarityOrder[a.rarity] - rarityOrder[b.rarity];
                    return rarityDiff !== 0 ? rarityDiff : a.title.localeCompare(b.title);
                  })
                  .map((achievement) => (
                    <AchievementCard
                      key={achievement.id}
                      achievement={achievement}
                      onPress={() => handleAchievementPress(achievement)}
                      showProgress={false}
                    />
                  ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Achievement Detail Modal */}
      <Modal
        visible={showDetailModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedAchievement && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Achievement Details</Text>
                  <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                    <Ionicons name="close" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>
                
                <AchievementCard 
                  achievement={selectedAchievement} 
                  showProgress={true} 
                />
                
                <View style={styles.modalDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Category:</Text>
                    <Text style={styles.detailValue}>
                      {selectedAchievement.category.charAt(0).toUpperCase() + selectedAchievement.category.slice(1)}
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Rarity:</Text>
                    <Text style={styles.detailValue}>
                      {getRarityIcon(selectedAchievement.rarity)} {selectedAchievement.rarity.toUpperCase()}
                    </Text>
                  </View>

                  {!selectedAchievement.unlocked && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Progress:</Text>
                      <Text style={styles.detailValue}>{selectedAchievement.progress}%</Text>
                    </View>
                  )}

                  {selectedAchievement.unlocked && selectedAchievement.unlockedAt && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Unlocked:</Text>
                      <Text style={styles.detailValue}>
                        {selectedAchievement.unlockedAt.toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                </View>
                
                <TouchableOpacity 
                  style={styles.modalButton}
                  onPress={() => setShowDetailModal(false)}
                >
                  <Text style={styles.modalButtonText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
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
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  statsContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statsTitle: {
    ...typography.h3,
    color: colors.text,
  },
  completionPercentage: {
    ...typography.h3,
    fontWeight: '700',
  },
  progressBarContainer: {
    marginBottom: spacing.lg,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.background,
    borderRadius: borderRadius.round,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.round,
  },
  progressText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickStat: {
    alignItems: 'center',
  },
  quickStatNumber: {
    ...typography.h2,
    color: colors.primary,
    fontWeight: '700',
  },
  quickStatLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  categoryContainer: {
    marginBottom: spacing.xl,
  },
  categoryTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  categoryScroll: {
    marginHorizontal: -spacing.md,
  },
  categoryButtons: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  categoryButton: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    minWidth: 80,
    gap: spacing.xs,
  },
  selectedCategoryButton: {
    backgroundColor: colors.primary,
  },
  categoryButtonText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
  },
  selectedCategoryButtonText: {
    color: colors.text,
    fontWeight: '600',
  },
  categoryCount: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 10,
  },
  selectedCategoryCount: {
    color: colors.text,
  },
  achievementSection: {
    gap: spacing.lg,
  },
  achievementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  achievementTitle: {
    ...typography.h3,
    color: colors.text,
  },
  achievementCount: {
    ...typography.body,
    color: colors.textSecondary,
  },
  achievementGroup: {
    gap: spacing.sm,
  },
  groupTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginLeft: spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '100%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text,
  },
  modalDetails: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  detailValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  modalButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.round,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  modalButtonText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
});

export default AchievementsScreen;