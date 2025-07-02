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
  getCurrentDraw,
  getUserDrawData,
  purchaseTickets,
  addFreeTickets,
  getTimeRemaining,
  canWatchAdForTickets,
  TICKET_COST,
  AD_REWARD_TICKETS,
} from '../utils/drawManager';
import adManager from '../utils/adManager';

interface DrawCardProps {
  userBalance: number;
  onBalanceUpdate: () => void;
}

const DrawCard: React.FC<DrawCardProps> = ({ userBalance, onBalanceUpdate }) => {
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
      const currentDraw = await getCurrentDraw();
      setDraw(currentDraw);
      
      const userDrawData = await getUserDrawData(currentDraw.id);
      setUserData(userDrawData);
      
      const adEligible = await canWatchAdForTickets(currentDraw.id);
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
  }, []);

  const handleWatchAdForTickets = async () => {
    if (!draw || isLoading || !canWatchAd) return;

    setIsLoading(true);
    
    try {
      const adResult = await adManager.showRewardedAd();
      
      if (adResult.success) {
        const ticketsEarned = await addFreeTickets(draw.id, true);
        
        if (ticketsEarned > 0) {
          // Update local state
          setUserData(prev => ({
            ...prev,
            ticketsOwned: prev.ticketsOwned + ticketsEarned,
          }));
          
          setCanWatchAd(false);
          
          Alert.alert(
            'Tickets Earned! 🎟️',
            `You earned ${ticketsEarned} free tickets by watching the ad! You now have ${userData.ticketsOwned + ticketsEarned} tickets total.`,
            [{ text: 'Awesome!' }]
          );
          
          // Preload next ad
          adManager.preloadAd();
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

    setIsLoading(true);
    
    try {
      const success = await purchaseTickets(draw.id, tickets);
      
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
          `You successfully purchased ${tickets} ticket(s) for ${totalCost} Digicoins! You now have ${userData.ticketsOwned + tickets} tickets total.`,
          [{ text: 'Great!' }]
        );
      } else {
        Alert.alert('Error', 'Failed to purchase tickets. Please try again.');
      }
    } catch (error) {
      console.error('Error purchasing tickets:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!draw) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading draw...</Text>
      </View>
    );
  }

  const renderPurchaseModal = () => (
    <Modal
      visible={showPurchaseModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowPurchaseModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Purchase Tickets</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Number of tickets:</Text>
            <TextInput
              style={styles.textInput}
              value={ticketCount}
              onChangeText={setTicketCount}
              keyboardType="numeric"
              placeholder="Enter number of tickets"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
          
          <View style={styles.costContainer}>
            <Text style={styles.costText}>
              Cost: {parseInt(ticketCount, 10) || 0} × {TICKET_COST} = {(parseInt(ticketCount, 10) || 0) * TICKET_COST} Digicoins
            </Text>
            <Text style={styles.balanceText}>
              Your Balance: {userBalance.toFixed(2)} Digicoins
            </Text>
          </View>
          
          <View style={styles.modalButtons}>
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
          
          <View style={styles.adOption}>
            <Text style={styles.adOptionText}>
              Or watch an ad to get {AD_REWARD_TICKETS} free tickets!
            </Text>
            <TouchableOpacity
              style={[styles.adButton, !canWatchAd && styles.disabledButton]}
              onPress={() => {
                setShowPurchaseModal(false);
                handleWatchAdForTickets();
              }}
              disabled={!canWatchAd}
            >
              <Ionicons name="play-circle" size={16} color={colors.text} />
              <Text style={styles.adButtonText}>
                {canWatchAd ? 'Watch Ad' : 'Wait 5min'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.surface, '#2A2D32']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Image
              source={require('../assets/logo.png')}
              style={styles.prizeIcon}
              resizeMode="contain"
            />
            <Text style={styles.prizeValue}>MacBook M4 Pro</Text>
          </View>
          
          <Text style={styles.prizeTitle}>{draw.prize}</Text>
          <Text style={styles.description}>
            Buy tickets to get the chance to win a {draw.prize}
          </Text>
          
          <View style={styles.statsContainer}>
            <Text style={styles.statText}>
              Your Tickets: {userData.ticketsOwned}
            </Text>
            <Text style={styles.statText}>
              Total Spent: {userData.totalSpent} Digicoins
            </Text>
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.enterButton, isLoading && styles.disabledButton]}
              onPress={() => setShowPurchaseModal(true)}
              disabled={isLoading}
            >
              <Text style={styles.enterButtonText}>
                {isLoading ? 'Loading...' : 'Buy Tickets'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.adButton, (!canWatchAd || isLoading) && styles.disabledButton]}
              onPress={handleWatchAdForTickets}
              disabled={!canWatchAd || isLoading}
            >
              <Ionicons name="play-circle" size={16} color={colors.text} />
              <Text style={styles.adButtonText}>
                {canWatchAd ? `+${AD_REWARD_TICKETS} Tickets` : 'Wait 5min'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.timeLeft}>Time left: {timeRemaining}</Text>
        </View>
      </LinearGradient>
      
      {renderPurchaseModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.xl,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  gradient: {
    padding: spacing.lg,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  prizeIcon: {
    width: 24,
    height: 24,
    marginRight: spacing.xs,
  },
  prizeValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  prizeTitle: {
    ...typography.h3,
    marginBottom: spacing.sm,
    color: colors.text,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  statsContainer: {
    marginBottom: spacing.md,
  },
  statText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs / 2,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  enterButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    flex: 1,
    marginRight: spacing.sm,
  },
  enterButtonText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  adButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  adButtonText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
    marginLeft: spacing.xs / 2,
  },
  disabledButton: {
    opacity: 0.5,
  },
  timeLeft: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  loadingContainer: {
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    ...typography.body,
    color: colors.text,
  },
  costContainer: {
    marginBottom: spacing.lg,
    padding: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: borderRadius.md,
  },
  costText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs / 2,
  },
  balanceText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  modalButtons: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelButtonText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  purchaseButton: {
    backgroundColor: colors.primary,
  },
  purchaseButtonText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  adOption: {
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: borderRadius.md,
  },
  adOptionText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
});

export default DrawCard; 