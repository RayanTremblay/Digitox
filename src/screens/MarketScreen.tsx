import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Header from '../components/Header';
import RewardCard, { Reward } from '../components/RewardCard';
import RedeemConfirmationModal from '../components/RedeemConfirmationModal';
import RedemptionModal from '../components/RedemptionModal';
import { Ionicons } from '@expo/vector-icons';
import { 
  getDigiStats, 
  hasEnoughDigicoins, 
  deductDigicoins, 
  addRedeemedReward,
  getDigicoinsBalance,
  updateStatsOnRedemption
} from '../utils/storage';
import {
  assignPromoCodeToUser,
  markUserPromoCodeAsUsed,
  getUserPromoCodeForOffer,
  getAvailableCodesCount,
  autoInitializeYourCodes
} from '../utils/codeManager';

type RootStackParamList = {
  MainTabs: undefined;
  Profile: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

const MarketScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [userBalance, setUserBalance] = useState(1000);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showRedemptionModal, setShowRedemptionModal] = useState(false);
  const [redemptionModalProps, setRedemptionModalProps] = useState({
    scenario: 'success' as 'success' | 'already_redeemed' | 'no_codes' | 'insufficient_balance' | 'error',
    promoCode: '',
    rewardTitle: '',
    userBalance: 0,
    requiredAmount: 0,
  });

  // Load user balance and initialize promo codes
  useEffect(() => {
    const initializeApp = async () => {
      await loadUserBalance();
      await autoInitializeYourCodes(); // Auto-initialize your promo codes
    };
    initializeApp();
  }, []);

  const loadUserBalance = async () => {
    try {
      const balance = await getDigicoinsBalance();
      setUserBalance(balance);
    } catch (error) {
      console.error('Error loading user balance:', error);
      setUserBalance(1000); // Set to 1000 as fallback
    }
  };

  const categories = [
    'All',
    'Health & Wellness',
    'Digital Wellness',
    'Gadgets',
    'Entertainment',
    'Education'
  ];

  const rewards: Reward[] = [
    // Gadgets
    {
      id: '1',
      title: 'Garmin Venu 3',
      description: 'Get 30% off on the latest Garmin smartwatch',
      subtext: 'Track your fitness journey with style',
      digicoins: 1,
      discount: '30% OFF',
      category: 'Gadgets',
      image: 'https://example.com/garmin.jpg',
      expiresAt: '2024-12-31',
      usesLeft: 1
    },
    {
      id: '2',
      title: 'Apple Watch Series 9',
      description: 'Save 25% on the newest Apple Watch',
      subtext: 'Stay connected and healthy',
      digicoins: 1,
      discount: '25% OFF',
      category: 'Gadgets',
      image: 'https://example.com/apple-watch.jpg',
      expiresAt: '2024-12-31',
      usesLeft: 1
    },
    {
      id: '3',
      title: 'Samsung Galaxy Watch 6',
      description: 'Get 20% off on Samsung\'s latest smartwatch',
      subtext: 'Advanced health monitoring',
      digicoins: 1,
      discount: '20% OFF',
      category: 'Gadgets',
      image: 'https://example.com/samsung.jpg',
      expiresAt: '2024-12-31',
      usesLeft: 1
    },
    // Health & Wellness
    {
      id: '4',
      title: 'Meditation App Premium',
      description: '3 months free premium subscription',
      subtext: 'Find your inner peace and reduce stress',
      digicoins: 2,
      discount: '100% OFF',
      category: 'Health & Wellness',
      image: 'https://example.com/meditation.jpg',
      expiresAt: '2024-12-31',
      usesLeft: 1
    },
    {
      id: '5',
      title: 'Yoga Class Pass',
      description: '5 free yoga classes at local studios',
      subtext: 'Strengthen your body and mind',
      digicoins: 3,
      discount: '$75 VALUE',
      category: 'Health & Wellness',
      image: 'https://example.com/yoga.jpg',
      expiresAt: '2024-12-31',
      usesLeft: 1
    },
    // Digital Wellness
    {
      id: '6',
      title: 'Screen Time Coach',
      description: 'Personal digital wellness coaching session',
      subtext: 'Learn healthy digital habits',
      digicoins: 4,
      discount: '$50 VALUE',
      category: 'Digital Wellness',
      image: 'https://example.com/coach.jpg',
      expiresAt: '2024-12-31',
      usesLeft: 1
    },
    {
      id: '7',
      title: 'Blue Light Glasses',
      description: '40% off premium blue light blocking glasses',
      subtext: 'Protect your eyes from screen strain',
      digicoins: 2,
      discount: '40% OFF',
      category: 'Digital Wellness',
      image: 'https://example.com/glasses.jpg',
      expiresAt: '2024-12-31',
      usesLeft: 1
    },
    // Entertainment
    {
      id: '8',
      title: 'Netflix Premium',
      description: '2 months free Netflix subscription',
      subtext: 'Enjoy your favorite shows and movies',
      digicoins: 3,
      discount: '$30 VALUE',
      category: 'Entertainment',
      image: 'https://example.com/netflix.jpg',
      expiresAt: '2024-12-31',
      usesLeft: 1
    },
    {
      id: '9',
      title: 'Spotify Premium',
      description: '3 months free music streaming',
      subtext: 'Listen to music without ads',
      digicoins: 2,
      discount: '$30 VALUE',
      category: 'Entertainment',
      image: 'https://example.com/spotify.jpg',
      expiresAt: '2024-12-31',
      usesLeft: 1
    },
    // Education
    {
      id: '10',
      title: 'Coursera Plus',
      description: '1 month free access to all courses',
      subtext: 'Learn new skills from top universities',
      digicoins: 5,
      discount: '$59 VALUE',
      category: 'Education',
      image: 'https://example.com/coursera.jpg',
      expiresAt: '2024-12-31',
      usesLeft: 1
    },
    {
      id: '11',
      title: 'Language Learning App',
      description: '6 months premium language learning',
      subtext: 'Master a new language',
      digicoins: 4,
      discount: '$60 VALUE',
      category: 'Education',
      image: 'https://example.com/language.jpg',
      expiresAt: '2024-12-31',
      usesLeft: 1
    }
  ];

  const filteredRewards = rewards.filter(reward => {
    const matchesSearch = reward.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         reward.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || reward.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleRedeem = (reward: Reward) => {
    setSelectedReward(reward);
    setShowConfirmation(true);
  };

  const showRedemptionResult = (
    scenario: 'success' | 'already_redeemed' | 'no_codes' | 'insufficient_balance' | 'error',
    promoCode?: string,
    rewardTitle?: string
  ) => {
    setRedemptionModalProps({
      scenario,
      promoCode: promoCode || '',
      rewardTitle: rewardTitle || '',
      userBalance,
      requiredAmount: selectedReward?.digicoins || 0,
    });
    setShowRedemptionModal(true);
    setShowConfirmation(false);
    setSelectedReward(null);
  };

  const handleConfirmRedeem = async (reward: Reward) => {
    try {
      const userId = 'user123'; // Replace with actual user ID from authentication

      // Check if user has enough balance
      if (userBalance < reward.digicoins) {
        showRedemptionResult('insufficient_balance', undefined, reward.title);
        return;
      }

      // Check if user already has a promo code for this specific offer
      const existingUserCode = await getUserPromoCodeForOffer(userId, reward.id);
      if (existingUserCode) {
        showRedemptionResult('already_redeemed', existingUserCode.code, reward.title);
        return;
      }

      // Get or assign promo code from the database
      const userPromoCode = await assignPromoCodeToUser(userId, reward.id, reward.expiresAt);

      if (!userPromoCode) {
        showRedemptionResult('no_codes', undefined, reward.title);
        return;
      }

      // Deduct Digicoins and update balance
      const deductionSuccess = await deductDigicoins(reward.digicoins);
      
      if (!deductionSuccess) {
        showRedemptionResult('error', undefined, reward.title);
        return;
      }
      
      // Update local state
      const newBalance = userBalance - reward.digicoins;
      setUserBalance(newBalance);
      
      // Add to redeemed rewards
      await addRedeemedReward({
        id: reward.id,
        redeemedAt: new Date().toISOString(),
        expiresAt: reward.expiresAt,
        usesLeft: reward.usesLeft || 1
      });

      // Update stats
      await updateStatsOnRedemption(reward.digicoins);

      // Show success modal with promo code
      showRedemptionResult('success', userPromoCode.code, reward.title);

    } catch (error) {
      console.error('Error redeeming reward:', error);
      showRedemptionResult('error', undefined, selectedReward?.title);
    }
  };

  return (
    <LinearGradient
      colors={['#1D2024', '#6E7A8A']}
      style={styles.container}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Header />
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Market</Text>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search rewards..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Categories */}
          <Text style={styles.sectionTitle}>Categories</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.categoriesContainer}
          >
            {categories.map((category) => (
              <TouchableOpacity 
                key={category} 
                style={[
                  styles.categoryButton,
                  selectedCategory === category && styles.categoryButtonActive
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[
                  styles.categoryText,
                  selectedCategory === category && styles.categoryTextActive
                ]}>{category}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Featured Section */}
          <Text style={styles.sectionTitle}>Featured Rewards</Text>
          {filteredRewards.length > 0 ? (
            filteredRewards.map((reward) => (
              <RewardCard
                key={reward.id}
                reward={reward}
                onRedeem={() => handleRedeem(reward)}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="gift-outline" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyStateTitle}>No Rewards Found</Text>
              <Text style={styles.emptyStateText}>
                {searchQuery 
                  ? `No rewards match "${searchQuery}"`
                  : selectedCategory === 'All' 
                    ? 'No rewards available at the moment'
                    : `No rewards available in ${selectedCategory}`
                }
              </Text>
              <Text style={styles.emptyStateSubtext}>
                Check back later or try a different category!
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Confirmation Modal */}
      <RedeemConfirmationModal
        visible={showConfirmation}
        reward={selectedReward}
        userBalance={userBalance}
        onConfirm={() => handleConfirmRedeem(selectedReward!)}
        onCancel={() => {
          setShowConfirmation(false);
          setSelectedReward(null);
        }}
      />

      {/* Redemption Result Modal */}
      <RedemptionModal
        visible={showRedemptionModal}
        onClose={() => setShowRedemptionModal(false)}
        scenario={redemptionModalProps.scenario}
        promoCode={redemptionModalProps.promoCode}
        rewardTitle={redemptionModalProps.rewardTitle}
        userBalance={redemptionModalProps.userBalance}
        requiredAmount={redemptionModalProps.requiredAmount}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.round,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl,
    marginHorizontal: spacing.md,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 40,
    ...typography.body,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  categoriesContainer: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl,
    minHeight: 44, // Ensure consistent height
  },
  categoryButton: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    marginRight: spacing.sm,
    minWidth: 80, // Ensure minimum width for consistency
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryButtonActive: {
    backgroundColor: colors.primary,
  },
  categoryText: {
    ...typography.body,
    color: colors.text,
  },
  categoryTextActive: {
    color: colors.background,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
    paddingHorizontal: spacing.lg,
  },
  emptyStateTitle: {
    ...typography.h3,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyStateText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptyStateSubtext: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default MarketScreen; 