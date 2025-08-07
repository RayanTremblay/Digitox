import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../theme/theme';
import { getUserPromoCodeForOffer, UserPromoCode } from '../utils/codeManager';
import { Reward } from './RewardCard';
import { useAuth } from '../contexts/AuthContext';

interface RedeemedCodeModalProps {
  visible: boolean;
  reward: Reward | null;
  onClose: () => void;
}

const RedeemedCodeModal: React.FC<RedeemedCodeModalProps> = ({ visible, reward, onClose }) => {
  const { user } = useAuth();
  const [promoCode, setPromoCode] = useState<UserPromoCode | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible && reward) {
      loadPromoCode();
    }
  }, [visible, reward]);

  const loadPromoCode = async () => {
    if (!reward) return;
    
    setIsLoading(true);
    try {
      const userId = user?.uid || 'anonymous'; // Use actual authenticated user ID
      const userCode = await getUserPromoCodeForOffer(userId, reward.id);
      setPromoCode(userCode);
    } catch (error) {
      console.error('Error loading promo code:', error);
      Alert.alert('Error', 'Failed to load your promo code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!promoCode) return;
    
    Alert.alert(
      'Promo Code',
      `Your code is: ${promoCode.code}\n\nTap and hold to select and copy this code.`,
      [{ text: 'OK' }]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!reward) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Your Promo Code</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.rewardInfo}>
            <Text style={styles.rewardTitle}>{reward.title}</Text>
            <Text style={styles.rewardDescription}>{reward.description}</Text>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading your code...</Text>
            </View>
          ) : promoCode ? (
            <View style={styles.codeContainer}>
              <Text style={styles.codeLabel}>Your Promo Code:</Text>
              <View style={styles.codeBox}>
                <Text style={styles.codeText}>{promoCode.code}</Text>
                <TouchableOpacity onPress={copyToClipboard} style={styles.copyButton}>
                  <Ionicons name="copy-outline" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.codeDetails}>
                <Text style={styles.detailText}>
                  Redeemed: {formatDate(promoCode.assignedAt)}
                </Text>
                <Text style={styles.detailText}>
                  Expires: {formatDate(promoCode.expiresAt)}
                </Text>
                {promoCode.isUsed && (
                  <Text style={[styles.detailText, styles.usedText]}>
                    Code has been used
                  </Text>
                )}
              </View>

              <View style={styles.instructionsContainer}>
                <Text style={styles.instructionsTitle}>How to use:</Text>
                <Text style={styles.instructionsText}>
                  1. Visit the retailer's website or app
                </Text>
                <Text style={styles.instructionsText}>
                  2. Add items to your cart
                </Text>
                <Text style={styles.instructionsText}>
                  3. Enter the promo code at checkout
                </Text>
                <Text style={styles.instructionsText}>
                  4. Enjoy your discount!
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.errorText}>
                No promo code found for this reward.
              </Text>
              <Text style={styles.errorSubtext}>
                This might be an error. Please contact support if you believe you should have a code for this reward.
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.closeModalButton} onPress={onClose}>
            <Text style={styles.closeModalButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
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
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.text,
  },
  closeButton: {
    padding: spacing.xs,
  },
  rewardInfo: {
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  rewardTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  rewardDescription: {
    ...typography.body,
    color: colors.textSecondary,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  codeContainer: {
    marginBottom: spacing.lg,
  },
  codeLabel: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  codeBox: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  codeText: {
    ...typography.h3,
    color: colors.primary,
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
  copyButton: {
    padding: spacing.xs,
  },
  codeDetails: {
    marginBottom: spacing.lg,
  },
  detailText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  usedText: {
    color: colors.primary,
    fontWeight: '600',
  },
  instructionsContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  instructionsTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  instructionsText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  errorText: {
    ...typography.body,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  errorSubtext: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  closeModalButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
  },
  closeModalButtonText: {
    ...typography.body,
    color: colors.background,
    fontWeight: '600',
  },
});

export default RedeemedCodeModal; 