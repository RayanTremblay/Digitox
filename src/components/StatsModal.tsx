import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Clipboard } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, borderRadius } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';

interface StatsModalProps {
  visible: boolean;
  onClose: () => void;
  promoCode: string;
  rewardTitle: string;
  expiresAt: string;
}

const StatsModal = ({
  visible,
  onClose,
  promoCode,
  rewardTitle,
  expiresAt,
}: StatsModalProps) => {
  const handleCopyCode = () => {
    Clipboard.setString(promoCode);
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
          <LinearGradient
            colors={[colors.primary, colors.primary]}
            style={styles.header}
          >
            <Text style={styles.headerTitle}>Reward Details</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.background} />
            </TouchableOpacity>
          </LinearGradient>

          <View style={styles.content}>
            <View style={styles.infoBox}>
              <Text style={styles.rewardTitle}>{rewardTitle}</Text>
              <View style={styles.promoCodeContainer}>
                <Text style={styles.promoCode}>Promo Code: {promoCode}</Text>
                <TouchableOpacity 
                  style={styles.copyButton}
                  onPress={handleCopyCode}
                >
                  <Ionicons name="copy-outline" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
              <Text style={styles.expiryDate}>
                Expires: {new Date(expiresAt).toLocaleDateString()}
              </Text>
            </View>
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
    width: '90%',
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.background,
  },
  closeButton: {
    padding: spacing.xs,
  },
  content: {
    padding: spacing.lg,
  },
  infoBox: {
    backgroundColor: colors.background,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
  },
  rewardTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  promoCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  promoCode: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
    flex: 1,
  },
  copyButton: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  expiryDate: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});

export default StatsModal; 