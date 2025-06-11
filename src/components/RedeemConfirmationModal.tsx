import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme/theme';
import { Reward } from './RewardCard';

interface RedeemConfirmationModalProps {
  visible: boolean;
  reward: Reward | null;
  onConfirm: () => void;
  onCancel: () => void;
  userBalance: number;
}

const RedeemConfirmationModal = ({
  visible,
  reward,
  onConfirm,
  onCancel,
  userBalance,
}: RedeemConfirmationModalProps) => {
  if (!reward) return null;

  const canAfford = userBalance >= reward.digicoins;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={onCancel}
        />
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Confirm Redemption</Text>
          
          <View style={styles.rewardInfo}>
            <Text style={styles.rewardName}>{reward.title}</Text>
            <Text style={styles.rewardCost}>{reward.digicoins} Digicoins</Text>
          </View>

          <View style={styles.balanceInfo}>
            <Text style={styles.balanceLabel}>Your Balance:</Text>
            <Text style={[
              styles.balanceAmount,
              !canAfford && styles.insufficientBalance
            ]}>
              {userBalance} Digicoins
            </Text>
          </View>

          {!canAfford && (
            <Text style={styles.errorMessage}>
              Insufficient Digicoins balance
            </Text>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
                !canAfford && styles.disabledButton
              ]}
              onPress={onConfirm}
              disabled={!canAfford}
            >
              <Text style={[styles.buttonText, styles.confirmButtonText]}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    width: '80%',
    maxWidth: 400,
    shadowColor: colors.text,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  rewardInfo: {
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.background,
  },
  rewardName: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  rewardCost: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  balanceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.background,
  },
  balanceLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  balanceAmount: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  insufficientBalance: {
    color: colors.error,
  },
  errorMessage: {
    ...typography.caption,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  button: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.surface,
  },
  confirmButton: {
    backgroundColor: colors.surface,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: colors.primary,
  },
});

export default RedeemConfirmationModal; 