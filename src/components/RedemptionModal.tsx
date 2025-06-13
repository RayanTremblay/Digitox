import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Alert, Clipboard } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';

export interface RedemptionModalProps {
  visible: boolean;
  onClose: () => void;
  scenario: 'success' | 'already_redeemed' | 'no_codes' | 'insufficient_balance' | 'error';
  promoCode?: string;
  rewardTitle?: string;
  userBalance?: number;
  requiredAmount?: number;
}

const RedemptionModal = ({
  visible,
  onClose,
  scenario,
  promoCode,
  rewardTitle,
  userBalance,
  requiredAmount,
}: RedemptionModalProps) => {

  const copyToClipboard = async (code: string) => {
    try {
      Clipboard.setString(code);
      Alert.alert('Copied!', 'Promo code copied to clipboard');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      Alert.alert('Error', 'Failed to copy code to clipboard');
    }
  };

  const renderSuccessContent = () => (
    <View style={styles.contentContainer}>
      <View style={styles.iconContainer}>
        <Ionicons name="checkmark-circle" size={60} color={colors.success} />
      </View>
      
      <Text style={styles.title}>Redemption Successful!</Text>
      
      <Text style={styles.description}>
        You have successfully redeemed {rewardTitle}!
      </Text>
      
      <View style={styles.codeContainer}>
        <Text style={styles.codeLabel}>Your Unique Promo Code:</Text>
        <View style={styles.codeBox}>
          <Text style={styles.codeText}>{promoCode}</Text>
          <TouchableOpacity 
            style={styles.copyButton}
            onPress={() => copyToClipboard(promoCode!)}
          >
            <Ionicons name="copy" size={20} color={colors.primary} />
            <Text style={styles.copyButtonText}>Copy</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <Text style={styles.note}>
        This is your unique promo code for this offer. Save it somewhere safe - you won't be able to get another one for this specific offer.
      </Text>
      
      <TouchableOpacity style={styles.standaloneButton} onPress={onClose}>
        <Text style={styles.primaryButtonText}>Got it!</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAlreadyRedeemedContent = () => (
    <View style={styles.contentContainer}>
      <View style={styles.iconContainer}>
        <Ionicons name="information-circle" size={60} color={colors.info} />
      </View>
      
      <Text style={styles.title}>You Already Have A Code!</Text>
      
      <Text style={styles.description}>
        You have already redeemed this offer. Here's your existing code:
      </Text>
      
      <View style={styles.codeContainer}>
        <Text style={styles.codeLabel}>Your Promo Code:</Text>
        <View style={styles.codeBox}>
          <Text style={styles.codeText}>{promoCode}</Text>
          <TouchableOpacity 
            style={styles.copyButton}
            onPress={() => copyToClipboard(promoCode!)}
          >
            <Ionicons name="copy" size={20} color={colors.primary} />
            <Text style={styles.copyButtonText}>Copy</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <Text style={styles.note}>
        You cannot redeem the same offer multiple times. However, you can redeem other offers to get additional codes.
      </Text>
      
      <TouchableOpacity 
        style={{
          backgroundColor: colors.primary,
          padding: spacing.md,
          borderRadius: borderRadius.md,
          alignItems: 'center',
          width: '100%',
        }} 
        onPress={onClose}
      >
        <Text style={{
          fontSize: 16,
          fontWeight: '600',
          color: '#FFFFFF',
        }}>Understood</Text>
      </TouchableOpacity>
    </View>
  );

  const renderNoCodesContent = () => (
    <View style={styles.contentContainer}>
      <View style={styles.iconContainer}>
        <Ionicons name="alert-circle" size={60} color={colors.warning} />
      </View>
      
      <Text style={styles.title}>No Codes Available</Text>
      
      <Text style={styles.description}>
        We're sorry, but all promo codes have been distributed to other users.
      </Text>
      
      <View style={styles.infoBox}>
        <Ionicons name="gift" size={24} color={colors.textSecondary} />
        <Text style={styles.infoText}>
          More codes may become available soon. Check back later or contact support.
        </Text>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
          <Text style={styles.secondaryButtonText}>Contact Support</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.primaryButton} onPress={onClose}>
          <Text style={styles.primaryButtonText}>OK</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderInsufficientBalanceContent = () => (
    <View style={styles.contentContainer}>
      <View style={styles.iconContainer}>
        <Ionicons name="wallet" size={60} color={colors.error} />
      </View>
      
      <Text style={styles.title}>Insufficient Balance</Text>
      
      <Text style={styles.description}>
        You don't have enough Digicoins to redeem this offer.
      </Text>
      
      <View style={styles.balanceContainer}>
        <View style={styles.balanceRow}>
          <Text style={styles.balanceLabel}>Required:</Text>
          <Text style={styles.balanceValue}>{requiredAmount} Digicoins</Text>
        </View>
        <View style={styles.balanceRow}>
          <Text style={styles.balanceLabel}>Your Balance:</Text>
          <Text style={[styles.balanceValue, styles.insufficientBalance]}>
            {userBalance} Digicoins
          </Text>
        </View>
        <View style={styles.balanceRow}>
          <Text style={styles.balanceLabel}>Needed:</Text>
          <Text style={styles.balanceValue}>
            {(requiredAmount || 0) - (userBalance || 0)} more Digicoins
          </Text>
        </View>
      </View>
      
      <Text style={styles.note}>
        Keep using the app to earn more Digicoins and come back when you have enough!
      </Text>
      
      <TouchableOpacity style={styles.standaloneButton} onPress={onClose}>
        <Text style={styles.primaryButtonText}>Keep Earning</Text>
      </TouchableOpacity>
    </View>
  );

  const renderErrorContent = () => (
    <View style={styles.contentContainer}>
      <View style={styles.iconContainer}>
        <Ionicons name="close-circle" size={60} color={colors.error} />
      </View>
      
      <Text style={styles.title}>Something Went Wrong</Text>
      
      <Text style={styles.description}>
        We encountered an error while processing your redemption. Please try again.
      </Text>
      
      <View style={styles.infoBox}>
        <Ionicons name="refresh" size={24} color={colors.textSecondary} />
        <Text style={styles.infoText}>
          If the problem persists, please contact our support team for assistance.
        </Text>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
          <Text style={styles.secondaryButtonText}>Contact Support</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.primaryButton} onPress={onClose}>
          <Text style={styles.primaryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderContent = () => {
    switch (scenario) {
      case 'success':
        return renderSuccessContent();
      case 'already_redeemed':
        return renderAlreadyRedeemedContent();
      case 'no_codes':
        return renderNoCodesContent();
      case 'insufficient_balance':
        return renderInsufficientBalanceContent();
      case 'error':
      default:
        return renderErrorContent();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.modalContent}>
          {renderContent()}
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
    width: '85%',
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
  contentContainer: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.lg,
    color: colors.textSecondary,
  },
  codeContainer: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  codeLabel: {
    ...typography.caption,
    textAlign: 'center',
    marginBottom: spacing.sm,
    color: colors.textSecondary,
  },
  codeBox: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  codeText: {
    ...typography.h3,
    fontFamily: 'monospace',
    flex: 1,
    textAlign: 'center',
    color: colors.primary,
    letterSpacing: 2,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    gap: spacing.xs,
  },
  copyButtonText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  note: {
    ...typography.caption,
    textAlign: 'center',
    marginBottom: spacing.lg,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  infoBox: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  infoText: {
    ...typography.caption,
    flex: 1,
    color: colors.textSecondary,
  },
  balanceContainer: {
    width: '100%',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  balanceLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  balanceValue: {
    ...typography.body,
    fontWeight: '600',
  },
  insufficientBalance: {
    color: colors.error,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  standaloneButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: 48,
  },
  primaryButtonText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  secondaryButtonText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.primary,
  },
  buttonIcon: {
    marginRight: spacing.xs,
  },
});

export default RedemptionModal; 