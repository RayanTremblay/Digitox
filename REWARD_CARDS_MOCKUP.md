# 🎁 Reward Cards Mockup - For Easy Reproduction

This file contains the complete mockup structure for reward cards that were removed from the MarketScreen. Use this to quickly restore reward functionality when implementing real rewards.

## Import Statements to Restore
```typescript
import RewardCard, { Reward } from '../components/RewardCard';
import RedeemConfirmationModal from '../components/RedeemConfirmationModal';
import RedemptionModal from '../components/RedemptionModal';
import RedeemedCodeModal from '../components/RedeemedCodeModal';
import { 
  hasEnoughDetoxcoins, 
  deductDetoxcoins, 
  addRedeemedReward,
  updateStatsOnRedemption,
  getRedeemedRewards,
  RedeemedReward
} from '../utils/storage';
import {
  assignPromoCodeToUser,
  markUserPromoCodeAsUsed,
  getUserPromoCodeForOffer,
  getAvailableCodesCount,
  autoInitializeYourCodes
} from '../utils/codeManager';
```

## State Variables to Restore
```typescript
const [searchQuery, setSearchQuery] = useState('');
const [selectedCategory, setSelectedCategory] = useState('All');
const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
const [showConfirmation, setShowConfirmation] = useState(false);
const [showRedemptionModal, setShowRedemptionModal] = useState(false);
const [showRedeemedCodeModal, setShowRedeemedCodeModal] = useState(false);
const [redeemedRewards, setRedeemedRewards] = useState<RedeemedReward[]>([]);
const [isRedeeming, setIsRedeeming] = useState(false);
const [redemptionModalProps, setRedemptionModalProps] = useState({
  scenario: 'success' as 'success' | 'already_redeemed' | 'no_codes' | 'insufficient_balance' | 'error',
  promoCode: '',
  rewardTitle: '',
  userBalance: 0,
  requiredAmount: 0,
});
```

## Categories Array
```typescript
const categories = [
  'All', 
  'Gadgets', 
  'Health & Wellness', 
  'Digital Wellness', 
  'Entertainment',
  'Education'
];
```

## Complete Rewards Array
```typescript
const rewards: Reward[] = [
  // Gadgets
  {
    id: '1',
    title: 'Garmin Venu 3',
    description: 'Get 30% off on the latest Garmin smartwatch',
    subtext: 'Track your fitness journey with style',
    detoxcoins: 1,
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
    detoxcoins: 1,
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
    detoxcoins: 1,
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
    detoxcoins: 2,
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
    detoxcoins: 3,
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
    detoxcoins: 4,
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
    detoxcoins: 2,
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
    detoxcoins: 3,
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
    detoxcoins: 2,
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
    detoxcoins: 5,
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
    detoxcoins: 4,
    discount: '$60 VALUE',
    category: 'Education',
    image: 'https://example.com/language.jpg',
    expiresAt: '2024-12-31',
    usesLeft: 1
  }
];
```

## Functions to Restore
```typescript
const loadRedeemedRewards = async () => {
  try {
    const redeemed = await getRedeemedRewards();
    setRedeemedRewards(redeemed);
  } catch (error) {
    console.error('Error loading redeemed rewards:', error);
  }
};

const filteredRewards = rewards.filter(reward => {
  const matchesSearch = reward.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       reward.description.toLowerCase().includes(searchQuery.toLowerCase());
  const matchesCategory = selectedCategory === 'All' || reward.category === selectedCategory;
  return matchesSearch && matchesCategory;
});

const isRewardRedeemed = (rewardId: string): boolean => {
  return redeemedRewards.some(redeemed => redeemed.id === rewardId);
};

const handleRedeem = (reward: Reward) => {
  if (isRewardRedeemed(reward.id)) {
    Alert.alert(
      'Already Redeemed',
      'You have already redeemed this offer.',
      [{ text: 'OK' }]
    );
    return;
  }
  
  setSelectedReward(reward);
  setShowConfirmation(true);
};

const handleShowRedeemedCode = (reward: Reward) => {
  setSelectedReward(reward);
  setShowRedeemedCodeModal(true);
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
    requiredAmount: selectedReward?.detoxcoins || 0,
  });
  setShowRedemptionModal(true);
  setShowConfirmation(false);
  setSelectedReward(null);
};

const handleConfirmRedeem = async (reward: Reward) => {
  try {
    setIsRedeeming(true);
    const userId = user?.uid || 'anonymous';

    if (userBalance < reward.detoxcoins) {
      showRedemptionResult('insufficient_balance', undefined, reward.title);
      return;
    }

    const existingUserCode = await getUserPromoCodeForOffer(userId, reward.id);
    if (existingUserCode) {
      showRedemptionResult('already_redeemed', existingUserCode.code, reward.title);
      return;
    }

    const userPromoCode = await assignPromoCodeToUser(userId, reward.id, reward.expiresAt);

    if (!userPromoCode) {
      showRedemptionResult('no_codes', undefined, reward.title);
      return;
    }

    const deductionSuccess = await deductDetoxcoins(reward.detoxcoins);
    
    if (!deductionSuccess) {
      showRedemptionResult('error', undefined, reward.title);
      return;
    }
    
    const newBalance = userBalance - reward.detoxcoins;
    setUserBalance(newBalance);
    
    await addRedeemedReward({
      id: reward.id,
      redeemedAt: new Date().toISOString(),
      expiresAt: reward.expiresAt,
      usesLeft: reward.usesLeft || 1
    });

    await updateStatsOnRedemption(reward.detoxcoins);
    showRedemptionResult('success', userPromoCode.code, reward.title);
    await loadRedeemedRewards();

  } catch (error) {
    console.error('Error during redemption:', error);
    showRedemptionResult('error', undefined, reward.title);
  } finally {
    setIsRedeeming(false);
  }
};
```

## Search and Filter UI
```tsx
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
      onShowRedeemedCode={() => handleShowRedeemedCode(reward)}
      isRedeemed={isRewardRedeemed(reward.id)}
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
```

## Modals to Restore
```tsx
{/* Confirmation Modal */}
<RedeemConfirmationModal
  visible={showConfirmation}
  reward={selectedReward}
  userBalance={userBalance}
  onConfirm={() => selectedReward && handleConfirmRedeem(selectedReward)}
  onCancel={() => {
    setShowConfirmation(false);
    setSelectedReward(null);
  }}
/>

{/* Redemption Result Modal */}
<RedemptionModal
  visible={showRedemptionModal}
  scenario={redemptionModalProps.scenario}
  promoCode={redemptionModalProps.promoCode}
  rewardTitle={redemptionModalProps.rewardTitle}
  userBalance={redemptionModalProps.userBalance}
  requiredAmount={redemptionModalProps.requiredAmount}
  onClose={() => {
    setShowRedemptionModal(false);
    setSelectedReward(null);
  }}
/>

{/* Redeemed Code Modal */}
<RedeemedCodeModal
  visible={showRedeemedCodeModal}
  reward={selectedReward}
  onClose={() => {
    setShowRedeemedCodeModal(false);
    setSelectedReward(null);
  }}
/>
```

## useEffect Additions
```typescript
useEffect(() => {
  const initializeApp = async () => {
    try {
      setIsLoading(true);
      await loadUserBalance();
      await loadRedeemedRewards();
      await autoInitializeYourCodes();
    } catch (error) {
      console.error('Error initializing MarketScreen:', error);
    } finally {
      setIsLoading(false);
    }
  };
  initializeApp();
}, []);
```

## Additional Styles
```typescript
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
categoriesContainer: {
  paddingHorizontal: spacing.md,
  marginBottom: spacing.xl,
  minHeight: 44,
},
categoryButton: {
  backgroundColor: colors.surface,
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.sm,
  borderRadius: borderRadius.round,
  marginRight: spacing.sm,
  minWidth: 80,
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
  fontStyle: 'italic',
},
```

## Instructions for Restoration

1. Copy the relevant sections from this file back to `MarketScreen.tsx`
2. Restore the import statements at the top
3. Add the state variables and functions
4. Replace the "Coming Soon" section with the search/filter/rewards UI
5. Add the modals before the closing `</LinearGradient>`
6. Add the additional styles to the StyleSheet
7. Test the functionality with the mockup data

This structure provides a complete reward system with categories, search, redemption flow, and promo code management.