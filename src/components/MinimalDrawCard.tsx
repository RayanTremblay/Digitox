import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../theme/theme';
import { 
  DrawEntry, 
  UserDrawData, 
  getUserDrawData, 
  purchaseTickets, 
  addFreeTickets, 
  getTimeRemaining,
  TICKET_COST,
  AD_REWARD_TICKETS,
  getCategoryIcon
} from '../utils/drawManager';
import { getDigicoinsBalance } from '../utils/storage';

interface MinimalDrawCardProps {
  draw: DrawEntry;
  onRefresh?: () => void;
}

const MinimalDrawCard: React.FC<MinimalDrawCardProps> = ({ draw, onRefresh }) => {
  const [userData, setUserData] = useState<UserDrawData>({ ticketsOwned: 0, totalSpent: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [balance, setBalance] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [ticketQuantity, setTicketQuantity] = useState('1');

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

  useEffect(() => {
    loadUserData();
    loadBalance();
  }, [draw.id]);

  const loadUserData = async () => {
    try {
      const data = await getUserDrawData(draw.id);
      setUserData(data);
    } catch (error) {
      console.error('Error loading user draw data:', error);
    }
  };

  const loadBalance = async () => {
    try {
      const currentBalance = await getDigicoinsBalance();
      setBalance(currentBalance);
    } catch (error) {
      console.error('Error loading balance:', error);
    }
  };



  const handleBuyTickets = () => {
    setShowModal(true);
  };

  const handleConfirmPurchase = async () => {
    const quantity = parseInt(ticketQuantity);
    if (isNaN(quantity) || quantity < 1) {
      Alert.alert('Invalid Quantity', 'Please enter a valid number of tickets.');
      return;
    }

    const totalCost = quantity * TICKET_COST;
    if (balance < totalCost) {
      Alert.alert('Insufficient Balance', `You need ${totalCost} Digicoins to buy ${quantity} tickets.`);
      return;
    }

    setIsLoading(true);
    try {
      const success = await purchaseTickets(draw.id, quantity);
      if (success) {
        await loadUserData();
        await loadBalance();
        onRefresh?.();
        setShowModal(false);
        setTicketQuantity('1');
        Alert.alert('Success!', `You purchased ${quantity} tickets for ${totalCost} Digicoins!`);
      } else {
        Alert.alert('Error', 'Failed to purchase tickets. Please try again.');
      }
    } catch (error) {
      console.error('Error purchasing tickets:', error);
      Alert.alert('Error', 'An error occurred while purchasing tickets.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWatchAdForTickets = async () => {
    setIsLoading(true);
    try {
      const ticketsAwarded = await addFreeTickets(draw.id, true);
      if (ticketsAwarded > 0) {
        Alert.alert('Success!', `You received ${ticketsAwarded} free tickets!`);
        await loadUserData();
        onRefresh?.();
      } else {
        Alert.alert('Ad Failed', 'The ad could not be completed. Please try again.');
      }
    } catch (error) {
      console.error('Error watching ad:', error);
      Alert.alert('Error', 'An error occurred while watching the ad.');
    } finally {
      setIsLoading(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return '#FFD700';
      case 'epic': return '#FF6B35';
      case 'rare': return '#4A90E2';
      case 'common': return '#7F8C8D';
      default: return '#7F8C8D';
    }
  };

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

  const rarityColor = getRarityColor(draw.rarity);
  const timeRemaining = getTimeRemaining(draw.endTime);
  const categoryIcon = getCategoryIcon(draw.category) as keyof typeof Ionicons.glyphMap;

  return (
    <>
      <Animated.View 
        style={[
          styles.drawCard,
          {
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          }
        ]}
      >
        <View style={styles.drawHeader}>
          <Ionicons name={categoryIcon} size={24} color={rarityColor} style={styles.drawIcon} />
          <View style={styles.drawInfo}>
            <Text style={styles.drawValue}>{draw.prizeValue}</Text>
            <View style={[styles.rarityBadge, { backgroundColor: rarityColor }]}>
              <Text style={styles.rarityText}>{draw.rarity.toUpperCase()}</Text>
            </View>
          </View>
        </View>
        
        <Text style={styles.drawTitle}>{draw.title}</Text>
        <Text style={styles.drawDescription}>{draw.description}</Text>
        <Text style={styles.drawSubtext}>Prize: {draw.prize}</Text>
        
        <View style={styles.drawFooter}>
          <Text style={styles.drawExpiry}>Ends: {timeRemaining}</Text>
          <Text style={styles.drawTickets}>Your tickets: {userData.ticketsOwned}</Text>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${Math.min((draw.totalTickets / 5000) * 100, 100)}%`,
                  backgroundColor: rarityColor 
                }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>{draw.totalTickets} total tickets sold</Text>
        </View>

        <View style={styles.buttonContainer}>
          <Animated.View style={[styles.buyButtonContainer, { transform: [{ scale: buttonScaleAnim }] }]}>
            <TouchableOpacity 
              style={styles.buyButton}
              onPress={handleBuyTickets}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.buyButtonText}>Buy Tickets</Text>
            </TouchableOpacity>
          </Animated.View>
          
          <TouchableOpacity 
            style={styles.adButton}
            onPress={handleWatchAdForTickets}
            disabled={isLoading}
          >
            <Ionicons name="play" size={14} color={colors.textSecondary} />
            <Text style={styles.adButtonText}>
              +{AD_REWARD_TICKETS}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Purchase Modal */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Buy Tickets</Text>
              <TouchableOpacity 
                onPress={() => setShowModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>{draw.title}</Text>
            <Text style={styles.modalInfo}>Each ticket costs {TICKET_COST} Digicoin</Text>
            <Text style={styles.modalBalance}>Your balance: {balance} Digicoins</Text>

            <View style={styles.quantityContainer}>
              <Text style={styles.quantityLabel}>Number of tickets:</Text>
              <TextInput
                style={styles.quantityInput}
                value={ticketQuantity}
                onChangeText={setTicketQuantity}
                keyboardType="numeric"
                placeholder="1"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <Text style={styles.totalCost}>
              Total cost: {parseInt(ticketQuantity) * TICKET_COST || 0} Digicoins
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.confirmButton}
                onPress={handleConfirmPurchase}
                disabled={isLoading}
              >
                <Text style={styles.confirmButtonText}>
                  {isLoading ? 'Processing...' : 'Buy Tickets'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  drawCard: {
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
  drawHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  drawIcon: {
    marginRight: spacing.sm,
  },
  drawInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  drawValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  rarityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000000',
  },
  drawTitle: {
    ...typography.h2,
    marginBottom: spacing.sm,
  },
  drawDescription: {
    ...typography.body,
    marginBottom: spacing.xs,
  },
  drawSubtext: {
    ...typography.caption,
    marginBottom: spacing.md,
  },
  drawFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  drawExpiry: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  drawTickets: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  progressContainer: {
    marginBottom: spacing.md,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.surface,
    borderRadius: 2,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  buyButtonContainer: {
    flex: 1,
  },
  buyButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
  },
  buyButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
  adButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  adButtonText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    marginLeft: spacing.xs / 2,
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
    margin: spacing.lg,
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
    ...typography.h2,
    color: colors.text,
  },
  closeButton: {
    padding: spacing.xs,
  },
  modalSubtitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  modalInfo: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  modalBalance: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: spacing.lg,
  },
  quantityContainer: {
    marginBottom: spacing.md,
  },
  quantityLabel: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  quantityInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    color: colors.text,
    fontSize: 16,
    textAlign: 'center',
  },
  totalCost: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
  },
  confirmButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
});

export default MinimalDrawCard; 