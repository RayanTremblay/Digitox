import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Header from '../components/Header';
import RewardCard, { Reward } from '../components/RewardCard';
import RedeemConfirmationModal from '../components/RedeemConfirmationModal';
import { Ionicons } from '@expo/vector-icons';
import { 
  getDigiStats, 
  hasEnoughDigicoins, 
  deductDigicoins, 
  addRedeemedReward,
  generateAndStorePromoCode,
  markPromoCodeAsUsed,
  getDigicoinsBalance,
  updateStatsOnRedemption,
  getTotalDigicoinsEarned,
  getRedemptionsCount,
  initializePromoCodePool,
  getPromoCodePoolStats,
  hasUserRedeemedOffer,
  resetPromoCodePool
} from '../utils/storage';
import StatsModal from '../components/StatsModal';
import OutOfStockModal from '../components/OutOfStockModal';

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
  const [showStats, setShowStats] = useState(false);
  const [statsData, setStatsData] = useState({
    promoCode: '',
    rewardTitle: '',
    expiresAt: '',
  });
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showOutOfStockModal, setShowOutOfStockModal] = useState(false);
  const [outOfStockReward, setOutOfStockReward] = useState('');

  useEffect(() => {
    loadUserBalance();
    // Initialize promo code pool for Garmin Venu 3
    initializePromoCodePool(
      'garmin-venu-3',
      ['MCCA1', 'RFTG2', 'PKIWD9'],
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
    );
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

  const handleConfirmRedeem = async () => {
    if (!selectedReward) return;

    try {
      // Check if user has enough balance
      if (userBalance < selectedReward.digicoins) {
        Alert.alert('Insufficient Balance', 'You don\'t have enough Digicoins to redeem this reward.');
        return;
      }

      // Get pool stats before redemption
      const poolStats = await getPromoCodePoolStats('garmin-venu-3');
      if (poolStats.available === 0) {
        setOutOfStockReward(selectedReward.title);
        setShowOutOfStockModal(true);
        setShowConfirmation(false);
        return;
      }

      // Generate and store promo code
      const promoCode = await generateAndStorePromoCode(
        'user123', // Replace with actual user ID
        'garmin-venu-3',
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      );

      // Deduct Digicoins
      await deductDigicoins(selectedReward.digicoins);

      // Update UI
      setUserBalance(prev => prev - selectedReward.digicoins);
      setStatsData({
        promoCode: promoCode.code,
        rewardTitle: selectedReward.title,
        expiresAt: promoCode.expiresAt
      });
      setShowStatsModal(true);
      setShowConfirmation(false);
      setSelectedReward(null);

    } catch (error) {
      console.error('Error redeeming reward:', error);
      Alert.alert('Error', error.message || 'Failed to redeem reward. Please try again.');
    }
  };

  // Add a function to reset the pool for testing
  const handleResetPool = async () => {
    try {
      await resetPromoCodePool();
      // Reinitialize the pool
      await initializePromoCodePool(
        'garmin-venu-3',
        ['MCCA1', 'RFTG2', 'PKIWD9'],
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      );
      Alert.alert('Success', 'Promo code pool has been reset.');
    } catch (error) {
      console.error('Error resetting pool:', error);
      Alert.alert('Error', 'Failed to reset promo code pool.');
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
          {filteredRewards.map((reward) => (
            <RewardCard
              key={reward.id}
              reward={reward}
              onRedeem={() => handleRedeem(reward)}
            />
          ))}
        </View>
      </ScrollView>

      {/* Confirmation Modal */}
      <RedeemConfirmationModal
        visible={showConfirmation}
        reward={selectedReward}
        userBalance={userBalance}
        onConfirm={handleConfirmRedeem}
        onCancel={() => {
          setShowConfirmation(false);
          setSelectedReward(null);
        }}
      />

      <StatsModal
        visible={showStatsModal}
        onClose={() => setShowStatsModal(false)}
        {...statsData}
      />

      <OutOfStockModal
        visible={showOutOfStockModal}
        onClose={() => setShowOutOfStockModal(false)}
        rewardTitle={outOfStockReward}
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
    color: colors.text,
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
    color: colors.text,
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
  },
  categoryButton: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    marginRight: spacing.sm,
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
});

export default MarketScreen; 