import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme/theme';
import { getDetoxStats } from '../utils/storage';
import { useBalance } from '../contexts/BalanceContext';

interface StatsModalProps {
  visible: boolean;
  onClose: () => void;
  stats?: {
    totalEarned: number;
    totalTimeSaved: number;
  };
}

const formatLongTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours === 0) {
    return `${minutes} minutes`;
  } else if (minutes === 0) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  } else {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ${minutes} minutes`;
  }
};

const StatsModal: React.FC<StatsModalProps> = ({ visible, onClose, stats: passedStats }) => {
  const { balance, refreshBalance } = useBalance();
  const [stats, setStats] = useState({
    totalEarned: 0,
    totalTimeSaved: 0,
  });

  useEffect(() => {
    if (visible) {
      if (passedStats) {
        setStats(passedStats);
      } else {
        loadStats();
      }
      refreshBalance(); // Refresh balance when modal opens
    }
  }, [visible, passedStats, refreshBalance]);

  const loadStats = async () => {
    const currentStats = await getDetoxStats();
    setStats({
      totalEarned: currentStats.totalEarned,
      totalTimeSaved: currentStats.totalTimeSaved,
    });
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, styles.statsModalContent]}>
          <View style={styles.statsHeader}>
            <Text style={styles.modalTitle}>Your Detoxcoin Stats</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={onClose}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <Image
                source={require('../assets/logo.png')}
                style={styles.statIcon}
                resizeMode="contain"
              />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statLabel}>Current Balance</Text>
              <Text style={styles.statValue}>{balance.toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <Image
                source={require('../assets/logo.png')}
                style={styles.statIcon}
                resizeMode="contain"
              />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statLabel}>Total Earned</Text>
              <Text style={styles.statValue}>{stats.totalEarned.toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <Image
                source={require('../assets/logo.png')}
                style={styles.statIcon}
                resizeMode="contain"
              />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statLabel}>Total Time Saved</Text>
              <Text style={styles.statValue}>{formatLongTime(stats.totalTimeSaved)}</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    width: '80%',
    maxWidth: 400,
  },
  statsModalContent: {
    padding: spacing.lg,
  },
  statsHeader: {
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
    marginBottom: spacing.xl,
    marginTop: spacing.lg,
  },
  modalTitle: {
    ...typography.h2,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: spacing.xl,
    fontWeight: '600',
  },
  closeButton: {
    position: 'absolute',
    right: -spacing.md,
    top: -spacing.xl,
    padding: spacing.sm,
    zIndex: 1,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '600',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  statIcon: {
    width: 24,
    height: 24,
  },
  statInfo: {
    flex: 1,
  },
  statLabel: {
    ...typography.body,
    color: '#E0E0E0',
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  statValue: {
    ...typography.h3,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default StatsModal; 