import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SHARE_OPTIONS, shareViaPlatform, shareViaSystem } from '../utils/shareManager';
import { 
  getReferralStats, 
  simulateLinkClick,
  REFERRAL_REWARD 
} from '../utils/referralManager';

interface ReferralModalProps {
  visible: boolean;
  onClose: () => void;
  onReferralComplete?: () => void; // Callback when balance updates
}

interface ReferralStats {
  userId: string;
  referralCode: string;
  invitesSent: number;
  successfulReferrals: number;
  totalEarned: number;
  currentBalance: number;
  rewardPerReferral: number;
}

const ReferralModal = ({ visible, onClose, onReferralComplete }: ReferralModalProps) => {
  const [stats, setStats] = useState<ReferralStats>({
    userId: '',
    referralCode: '',
    invitesSent: 0,
    successfulReferrals: 0,
    totalEarned: 0,
    currentBalance: 0,
    rewardPerReferral: REFERRAL_REWARD,
  });
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    if (visible) {
      loadReferralStats();
    }
  }, [visible]);

  const loadReferralStats = async () => {
    try {
      const referralStats = await getReferralStats();
      setStats(referralStats);
    } catch (error) {
      console.error('Error loading referral stats:', error);
    }
  };

  const handleShare = async (optionId: string) => {
    if (isSharing) return;
    
    setIsSharing(true);
    try {
      const option = SHARE_OPTIONS.find(opt => opt.id === optionId);
      
      if (option) {
        const success = await shareViaPlatform(option, stats.userId);
        if (success) {
          // Reload stats to show updated invite count
          await loadReferralStats();
          
          Alert.alert(
            'Invite Sent!',
            `Your referral link has been shared via ${option.name}. You'll earn ${REFERRAL_REWARD} Detoxcoins when someone clicks your link and downloads the app!`,
            [{ text: 'Awesome!' }]
          );
        }
      } else {
        // Fallback to system share
        const success = await shareViaSystem(stats.userId);
        if (success) {
          await loadReferralStats();
          Alert.alert(
            'Invite Sent!',
            `Your referral link has been shared. You'll earn ${REFERRAL_REWARD} Detoxcoins when someone clicks your link!`,
            [{ text: 'Great!' }]
          );
        }
      }
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share invite. Please try again.');
    } finally {
      setIsSharing(false);
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
              <Text style={styles.title}>Invite Friends</Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Reward Info */}
            <LinearGradient
              colors={['#6C63FF', '#5A52E5']}
              style={styles.rewardCard}
            >
              <View style={styles.rewardHeader}>
                <Image
                  source={require('../assets/logo.png')}
                  style={styles.rewardIcon}
                  resizeMode="contain"
                />
                <Text style={styles.rewardAmount}>{REFERRAL_REWARD}</Text>
              </View>
              <Text style={styles.rewardText}>
                Detoxcoins for each friend you invite
              </Text>
              <Text style={styles.rewardSubtext}>
                Your friend gets a bonus too when they join!
              </Text>
            </LinearGradient>

            {/* Referral Link */}
            <View style={styles.codeSection}>
              <Text style={styles.sectionTitle}>Your Referral Link</Text>
              <TouchableOpacity
                style={styles.linkContainer}
                onPress={() => handleShare('copy')}
              >
                <Ionicons name="link" size={20} color={colors.primary} style={styles.linkIcon} />
                <Text style={styles.linkText}>detoxly.app/invite?referrer={stats.userId}</Text>
                <Ionicons name="copy" size={16} color={colors.primary} />
              </TouchableOpacity>
              <Text style={styles.linkHint}>Tap to copy your personal invite link</Text>
            </View>

            {/* Stats */}
            <View style={styles.statsSection}>
              <Text style={styles.sectionTitle}>Your Referral Stats</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{stats.invitesSent}</Text>
                  <Text style={styles.statLabel}>Invites Sent</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{stats.successfulReferrals}</Text>
                  <Text style={styles.statLabel}>Friends Joined</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{stats.totalEarned}</Text>
                  <Text style={styles.statLabel}>Detoxcoins Earned</Text>
                </View>
              </View>
            </View>

            {/* Share Options */}
            <View style={styles.shareSection}>
              <Text style={styles.sectionTitle}>Share Your Invite</Text>
              <View style={styles.shareGrid}>
                {SHARE_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={styles.shareOption}
                    onPress={() => handleShare(option.id)}
                    disabled={isSharing}
                  >
                    <View style={[styles.shareIconContainer, { backgroundColor: option.color }]}>
                      <Ionicons 
                        name={option.icon as any} 
                        size={24} 
                        color={option.id === 'snapchat' ? '#000' : '#fff'} 
                      />
                    </View>
                    <Text style={styles.shareOptionText}>{option.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* How it Works */}
            <View style={styles.howItWorksSection}>
              <Text style={styles.sectionTitle}>How It Works</Text>
              <View style={styles.stepContainer}>
                <View style={styles.step}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>1</Text>
                  </View>
                  <Text style={styles.stepText}>
                    Share your personal referral link with friends
                  </Text>
                </View>
                <View style={styles.step}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>2</Text>
                  </View>
                  <Text style={styles.stepText}>
                    They click your link and download the app
                  </Text>
                </View>
                <View style={styles.step}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>3</Text>
                  </View>
                  <Text style={styles.stepText}>
                    You automatically earn {REFERRAL_REWARD} Detoxcoins!
                  </Text>
                </View>
              </View>
            </View>

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
  rewardCard: {
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  rewardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  rewardIcon: {
    width: 32,
    height: 32,
    marginRight: spacing.sm,
  },
  rewardAmount: {
    ...typography.h1,
    color: '#fff',
    fontWeight: 'bold',
  },
  rewardText: {
    ...typography.body,
    color: '#fff',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  rewardSubtext: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  codeSection: {
    padding: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  linkIcon: {
    marginRight: spacing.sm,
  },
  linkText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
    fontSize: 12,
  },
  linkHint: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  referralCode: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    letterSpacing: 2,
  },
  copyCodeButton: {
    padding: spacing.sm,
  },
  statsSection: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
  shareSection: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  shareGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  shareOption: {
    alignItems: 'center',
    width: '18%',
    marginBottom: spacing.md,
  },
  shareIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  shareOptionText: {
    ...typography.caption,
    color: colors.text,
    textAlign: 'center',
    fontSize: 10,
  },
  howItWorksSection: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  stepContainer: {
    marginTop: spacing.sm,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  stepNumberText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: 'bold',
  },
  stepText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
});

export default ReferralModal; 