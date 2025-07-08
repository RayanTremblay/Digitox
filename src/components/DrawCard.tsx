import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Image,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  DrawEntry,
  UserDrawData,
  getDrawById,
  getUserDrawData,
  purchaseTickets,
  addFreeTickets,
  getTimeRemaining,
  canWatchAdForTickets,
  getRarityColor,
  getCategoryIcon,
  TICKET_COST,
  AD_REWARD_TICKETS,
} from '../utils/drawManager';
import adManager from '../utils/adManager';

interface DrawCardProps {
  drawId: string;
  userBalance: number;
  onBalanceUpdate: () => void;
  style?: any;
}

const DrawCard: React.FC<DrawCardProps> = ({ drawId, userBalance, onBalanceUpdate, style }) => {
  const [draw, setDraw] = useState<DrawEntry | null>(null);
  const [userData, setUserData] = useState<UserDrawData>({ ticketsOwned: 0, totalSpent: 0 });
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [ticketCount, setTicketCount] = useState('1');
  const [isLoading, setIsLoading] = useState(false);
  const [canWatchAd, setCanWatchAd] = useState(true);

  // Load draw data
  const loadDrawData = async () => {
    try {
      const currentDraw = await getDrawById(drawId);
      if (!currentDraw) {
        console.error('Draw not found:', drawId);
        return;
      }
      setDraw(currentDraw);
      
      const userDrawData = await getUserDrawData(drawId);
      setUserData(userDrawData);
      
      const adEligible = await canWatchAdForTickets(drawId);
      setCanWatchAd(adEligible);
    } catch (error) {
      console.error('Error loading draw data:', error);
    }
  };

  // Update timer
  useEffect(() => {
    if (draw) {
      const updateTimer = () => {
        setTimeRemaining(getTimeRemaining(draw.endTime));
      };
      
      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      
      return () => clearInterval(interval);
    }
  }, [draw]);

  // Load data on mount
  useEffect(() => {
    loadDrawData();
  }, [drawId]);

  const handleWatchAdForTickets = async () => {
    if (!draw || isLoading || !canWatchAd) return;

    setIsLoading(true);
    
    try {
      const adResult = await adManager.showRewardedAd();
      
      if (adResult.success) {
        const ticketsEarned = await addFreeTickets(drawId, true);
        
        if (ticketsEarned > 0) {
          // Update local state
          setUserData(prev => ({
            ...prev,
            ticketsOwned: prev.ticketsOwned + ticketsEarned,
          }));
          
          setCanWatchAd(false);
          
          Alert.alert(
            'Tickets Earned! 🎟️',
            `You earned ${ticketsEarned} free tickets by watching the ad! You now have ${userData.ticketsOwned + ticketsEarned} tickets for ${draw.title}.`,
            [{ text: 'Awesome!' }]
          );
          
          // Preload next ad
          adManager.preloadAd();
        } else {
          Alert.alert(
            'Maximum Reached',
            `You've reached the maximum number of tickets (${draw.maxTicketsPerUser}) for this draw.`,
            [{ text: 'OK' }]
          );
        }
      } else {
        Alert.alert(
          'Ad Required',
          'You need to watch the full ad to earn free tickets.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error watching ad for tickets:', error);
      Alert.alert('Error', 'Failed to load ad. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchaseTickets = async () => {
    if (!draw || isLoading) return;

    const tickets = parseInt(ticketCount, 10);
    if (isNaN(tickets) || tickets < 1) {
      Alert.alert('Invalid Input', 'Please enter a valid number of tickets.');
      return;
    }

    const totalCost = tickets * TICKET_COST;
    
    if (userBalance < totalCost) {
      Alert.alert(
        'Insufficient Balance',
        `You need ${totalCost} Digicoins to purchase ${tickets} ticket(s). You currently have ${userBalance.toFixed(2)} Digicoins.`,
        [
          { text: 'Cancel' },
          { 
            text: 'Watch Ad for Tickets', 
            onPress: () => {
              setShowPurchaseModal(false);
              handleWatchAdForTickets();
            }
          }
        ]
      );
      return;
    }

    // Check if user would exceed max tickets
    if (draw.maxTicketsPerUser && userData.ticketsOwned + tickets > draw.maxTicketsPerUser) {
      const remainingTickets = draw.maxTicketsPerUser - userData.ticketsOwned;
      Alert.alert(
        'Maximum Tickets Exceeded',
        `You can only purchase ${remainingTickets} more ticket(s) for this draw. Maximum allowed: ${draw.maxTicketsPerUser}`,
        [{ text: 'OK' }]
      );
      return;
    }

    setIsLoading(true);
    
    try {
      const success = await purchaseTickets(drawId, tickets);
      
      if (success) {
        // Update local state
        setUserData(prev => ({
          ...prev,
          ticketsOwned: prev.ticketsOwned + tickets,
          totalSpent: prev.totalSpent + totalCost,
        }));
        
        // Update parent balance
        onBalanceUpdate();
        
        setShowPurchaseModal(false);
        setTicketCount('1');
        
        Alert.alert(
          'Tickets Purchased! 🎟️',
          `You successfully purchased ${tickets} ticket(s) for ${totalCost} Digicoins! You now have ${userData.ticketsOwned + tickets} tickets for ${draw.title}.`,
          [{ text: 'Great!' }]
        );
      } else {
        Alert.alert('Error', 'Failed to purchase tickets. Please try again.');
      }
    } catch (error) {
      console.error('Error purchasing tickets:', error);
      if (error instanceof Error && error.message.includes('Maximum')) {
        Alert.alert('Maximum Reached', error.message);
      } else {
        Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!draw) {
    return (
      <View style={[styles.loadingContainer, style]}>
        <Text style={styles.loadingText}>Loading draw...</Text>
      </View>
    );
  }

  const rarityColor = getRarityColor(draw.rarity);
  const categoryIcon = getCategoryIcon(draw.category);
  const progressPercentage = draw.totalTickets > 0 ? Math.min((userData.ticketsOwned / draw.totalTickets) * 100, 100) : 0;

  const renderPurchaseModal = () => (
    <Modal
      visible={showPurchaseModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowPurchaseModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Purchase Tickets</Text>
            <TouchableOpacity 
              onPress={() => setShowPurchaseModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.drawInfo}>
            <Text style={styles.drawTitle}>{draw.title}</Text>
            <Text style={styles.drawPrize}>{draw.prize}</Text>
            <View style={styles.rarityBadge}>
              <View style={[styles.rarityDot, { backgroundColor: rarityColor }]} />
              <Text style={[styles.rarityText, { color: rarityColor }]}>
                {draw.rarity.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.ticketInputContainer}>
            <Text style={styles.inputLabel}>Number of tickets:</Text>
            <TextInput
              style={styles.ticketInput}
              value={ticketCount}
              onChangeText={setTicketCount}
              keyboardType="numeric"
              placeholder="1"
              placeholderTextColor={colors.textSecondary}
            />
            <Text style={styles.costText}>
              Cost: {parseInt(ticketCount, 10) * TICKET_COST || 0} Digicoins
            </Text>
          </View>

          <View style={styles.userStats}>
            <Text style={styles.statText}>Your tickets: {userData.ticketsOwned}</Text>
            <Text style={styles.statText}>Total spent: {userData.totalSpent} Digicoins</Text>
            {draw.maxTicketsPerUser && (
              <Text style={styles.statText}>
                Max allowed: {draw.maxTicketsPerUser} tickets
              </Text>
            )}
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowPurchaseModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.purchaseButton]}
              onPress={handlePurchaseTickets}
              disabled={isLoading}
            >
              <Text style={styles.purchaseButtonText}>
                {isLoading ? 'Processing...' : 'Purchase'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={styles.card}
      >
        {/* Header with rarity and category */}
        <View style={styles.header}>
          <View style={styles.categoryContainer}>
            <Ionicons name={categoryIcon} size={16} color={colors.white} />
            <Text style={styles.categoryText}>{draw.category.toUpperCase()}</Text>
          </View>
          <View style={styles.rarityBadge}>
            <View style={[styles.rarityDot, { backgroundColor: rarityColor }]} />
            <Text style={[styles.rarityText, { color: rarityColor }]}>
              {draw.rarity.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Prize info */}
        <View style={styles.prizeSection}>
          <Text style={styles.prizeTitle}>{draw.title}</Text>
          <Text style={styles.prizeValue}>{draw.prizeValue}</Text>
          <Text style={styles.prizeDescription}>{draw.description}</Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[styles.progressFill, { width: `${progressPercentage}%` }]} 
            />
          </View>
          <Text style={styles.progressText}>
            {userData.ticketsOwned} / {draw.totalTickets} tickets
          </Text>
        </View>

        {/* Time remaining */}
        <View style={styles.timeContainer}>
          <Ionicons name="time" size={16} color={colors.white} />
          <Text style={styles.timeText}>{timeRemaining}</Text>
        </View>

        {/* User stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Your Tickets</Text>
            <Text style={styles.statValue}>{userData.ticketsOwned}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total Spent</Text>
            <Text style={styles.statValue}>{userData.totalSpent}</Text>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.buyButton]}
            onPress={() => setShowPurchaseModal(true)}
            disabled={isLoading}
          >
            <Ionicons name="wallet" size={16} color={colors.white} />
            <Text style={styles.buyButtonText}>Buy Tickets</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton, 
              styles.adButton,
              !canWatchAd && styles.disabledButton
            ]}
            onPress={handleWatchAdForTickets}
            disabled={isLoading || !canWatchAd}
          >
            <Ionicons name="add-circle" size={16} color={colors.white} />
            <Text style={styles.adButtonText}>
              {canWatchAd ? `+${AD_REWARD_TICKETS} Tickets` : 'Ad Cooldown'}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {renderPurchaseModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  loadingContainer: {
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    margin: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  categoryText: {
    ...typography.caption,
    color: colors.white,
    marginLeft: spacing.xs,
    fontWeight: '600',
  },
  rarityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  rarityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: spacing.xs,
  },
  rarityText: {
    ...typography.caption,
    fontWeight: '600',
  },
  prizeSection: {
    marginBottom: spacing.md,
  },
  prizeTitle: {
    ...typography.h3,
    color: colors.white,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  prizeValue: {
    ...typography.h4,
    color: colors.accent,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  prizeDescription: {
    ...typography.body,
    color: colors.white,
    opacity: 0.8,
  },
  progressContainer: {
    marginBottom: spacing.md,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 4,
  },
  progressText: {
    ...typography.caption,
    color: colors.white,
    textAlign: 'center',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  timeText: {
    ...typography.body,
    color: colors.white,
    marginLeft: spacing.xs,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: borderRadius.sm,
    padding: spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    ...typography.caption,
    color: colors.white,
    opacity: 0.8,
    marginBottom: spacing.xs,
  },
  statValue: {
    ...typography.h4,
    color: colors.white,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  buyButton: {
    backgroundColor: colors.accent,
  },
  adButton: {
    backgroundColor: colors.success,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buyButtonText: {
    ...typography.button,
    color: colors.white,
    marginLeft: spacing.xs,
  },
  adButtonText: {
    ...typography.button,
    color: colors.white,
    marginLeft: spacing.xs,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: spacing.xs,
  },
  drawInfo: {
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  drawTitle: {
    ...typography.h4,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  drawPrize: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  ticketInputContainer: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  ticketInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.body,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  costText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  userStats: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  statText: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  purchaseButton: {
    backgroundColor: colors.primary,
  },
  cancelButtonText: {
    ...typography.button,
    color: colors.text,
  },
  purchaseButtonText: {
    ...typography.button,
    color: colors.white,
  },
});

export default DrawCard; 