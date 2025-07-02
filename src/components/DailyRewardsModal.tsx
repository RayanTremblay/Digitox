import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  getDailyRewardsStats,
  getRewardProbabilities,
  getRecentClaims,
  claimDailyReward,
  DailyClaimRecord,
} from '../utils/dailyRewardsManager';

interface DailyRewardsModalProps {
  visible: boolean;
  onClose: () => void;
  onRewardClaimed?: () => void;
}

interface DailyRewardsStats {
  claimsToday: number;
  maxClaims: number;
  remainingClaims: number;
  totalClaimed: number;
  totalEarned: number;
  canClaim: boolean;
}

const DailyRewardsModal = ({ visible, onClose, onRewardClaimed }: DailyRewardsModalProps) => {
  const [stats, setStats] = useState<DailyRewardsStats>({
    claimsToday: 0,
    maxClaims: 3,
    remainingClaims: 3,
    totalClaimed: 0,
    totalEarned: 0,
    canClaim: true,
  });
  const [recentClaims, setRecentClaims] = useState<DailyClaimRecord[]>([]);
  const [isClaiming, setIsClaiming] = useState(false);
  const [showProbabilities, setShowProbabilities] = useState(false);

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible]);

  const loadData = async () => {
    try {
      const [statsData, claimsData] = await Promise.all([
        getDailyRewardsStats(),
        getRecentClaims(5),
      ]);
      setStats(statsData);
      setRecentClaims(claimsData);
    } catch (error) {
      console.error('Error loading daily rewards data:', error);
    }
  };

  const handleClaim = async () => {
    if (isClaiming || !stats.canClaim) return;

    setIsClaiming(true);
    try {
      const result = await claimDailyReward();

      if (result.success && result.reward !== undefined) {
        await loadData(); // Refresh data
        onRewardClaimed?.(); // Notify parent

        Alert.alert(
          'Daily Reward Claimed! 🎉',
          `Amazing! You earned ${result.reward} Digicoins!`,
          [{ text: 'Awesome!' }]
        );
      } else {
        Alert.alert(
          'Claim Failed',
          result.error || 'Failed to claim reward. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error claiming reward:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setIsClaiming(false);
    }
  };

  const probabilities = getRewardProbabilities();

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Common': return '#4CAF50';
      case 'Uncommon': return '#2196F3';
      case 'Rare': return '#9C27B0';
      case 'Very Rare': return '#FF5722';
      case 'Epic': return '#FF9800';
      case 'Legendary': return '#FFD700';
      default: return colors.textSecondary;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Daily Rewards</Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Progress Card */}
            <LinearGradient
              colors={['#4A90B2', '#2A5470']}
              style={styles.progressCard}
            >
              <Text style={styles.progressTitle}>Today's Progress</Text>
              <Text style={styles.progressText}>
                {stats.claimsToday} / {stats.maxClaims} rewards claimed
              </Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${(stats.claimsToday / stats.maxClaims) * 100}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressSubtext}>
                {stats.remainingClaims > 0 
                  ? `${stats.remainingClaims} rewards remaining today`
                  : 'Come back tomorrow for more rewards!'
                }
              </Text>
            </LinearGradient>

            {/* Claim Button */}
            <TouchableOpacity
              style={[
                styles.claimButton,
                (!stats.canClaim || isClaiming) && styles.claimButtonDisabled
              ]}
              onPress={handleClaim}
              disabled={!stats.canClaim || isClaiming}
            >
              <View style={styles.claimButtonContent}>
                <Ionicons 
                  name={isClaiming ? "hourglass" : "gift"} 
                  size={24} 
                  color="#fff" 
                  style={styles.claimIcon}
                />
                <Text style={styles.claimButtonText}>
                  {isClaiming 
                    ? 'Claiming...' 
                    : stats.canClaim 
                      ? 'Watch Ad & Claim Reward' 
                      : 'All rewards claimed today'
                  }
                </Text>
              </View>
              {stats.canClaim && (
                <Text style={styles.claimHint}>Get 0-100 Digicoins randomly!</Text>
              )}
            </TouchableOpacity>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.totalClaimed}</Text>
                <Text style={styles.statLabel}>Total Claims</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.totalEarned}</Text>
                <Text style={styles.statLabel}>Total Earned</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {stats.totalClaimed > 0 ? Math.round(stats.totalEarned / stats.totalClaimed) : 0}
                </Text>
                <Text style={styles.statLabel}>Average Reward</Text>
              </View>
            </View>

            {/* Probabilities Section */}
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => setShowProbabilities(!showProbabilities)}
              >
                <Text style={styles.sectionTitle}>Reward Probabilities</Text>
                <Ionicons 
                  name={showProbabilities ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color={colors.text} 
                />
              </TouchableOpacity>
              
              {showProbabilities && (
                <View style={styles.probabilitiesContainer}>
                  {probabilities.map((prob, index) => (
                    <View key={index} style={styles.probabilityItem}>
                      <View style={styles.probabilityRange}>
                        <Text style={styles.rangeText}>{prob.range}</Text>
                        <View style={[
                          styles.rarityBadge, 
                          { backgroundColor: getRarityColor(prob.rarity) }
                        ]}>
                          <Text style={styles.rarityText}>{prob.rarity}</Text>
                        </View>
                      </View>
                      <Text style={styles.probabilityText}>{prob.probability}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Recent Claims */}
            {recentClaims.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent Claims</Text>
                <View style={styles.claimsContainer}>
                  {recentClaims.map((claim) => (
                    <View key={claim.id} style={styles.claimItem}>
                      <View style={styles.claimInfo}>
                        <Text style={styles.claimReward}>+{claim.reward}</Text>
                        <Text style={styles.claimDate}>
                          {formatDate(claim.timestamp)}
                        </Text>
                      </View>
                      <Ionicons name="gift" size={16} color={colors.primary} />
                    </View>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  title: {
    ...typography.h2,
    color: colors.text,
  },
  closeButton: {
    padding: spacing.xs,
  },
  progressCard: {
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  progressTitle: {
    ...typography.h3,
    color: '#fff',
    marginBottom: spacing.sm,
  },
  progressText: {
    ...typography.h1,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  progressSubtext: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  claimButton: {
    backgroundColor: colors.primary,
    margin: spacing.lg,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  claimButtonDisabled: {
    backgroundColor: colors.surface,
    opacity: 0.6,
  },
  claimButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  claimIcon: {
    marginRight: spacing.sm,
  },
  claimButtonText: {
    ...typography.body,
    color: '#fff',
    fontWeight: 'bold',
  },
  claimHint: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    paddingBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    ...typography.h2,
    color: colors.primary,
    fontWeight: 'bold',
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  section: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
  },
  probabilitiesContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  probabilityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  probabilityRange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rangeText: {
    ...typography.body,
    color: colors.text,
    marginRight: spacing.sm,
    minWidth: 60,
  },
  rarityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  rarityText: {
    ...typography.caption,
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 10,
  },
  probabilityText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: 'bold',
  },
  claimsContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  claimItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  claimInfo: {
    flex: 1,
  },
  claimReward: {
    ...typography.body,
    color: colors.primary,
    fontWeight: 'bold',
  },
  claimDate: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});

export default DailyRewardsModal; 