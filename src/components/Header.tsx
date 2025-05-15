import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors, typography, spacing, borderRadius } from '../theme/theme';
import StatsModal from './StatsModal';

type RootStackParamList = {
  MainTabs: undefined;
  Profile: undefined;
  Detox: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface HeaderProps {
  showProfile?: boolean;
  userInitials?: string;
  showBack?: boolean;
}

// Mock data - In a real app, these would come from a backend/storage
const userStats = {
  currentBalance: 150.88,
  totalEarned: 892.45,
  totalTimeSaved: 53460, // in seconds (about 14.85 hours)
};

const Header = ({ showProfile = true, userInitials = 'RT', showBack = false }: HeaderProps) => {
  const navigation = useNavigation<NavigationProp>();
  const [showStatsModal, setShowStatsModal] = useState(false);

  const handleProfilePress = () => {
    navigation.navigate('Profile');
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  return (
    <>
      <View style={[styles.header, showBack && styles.headerWithBack]}>
        {showBack && (
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBackPress}
          >
            <Icon name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
        )}
        {showProfile && (
          <TouchableOpacity
            style={styles.profileButton}
            onPress={handleProfilePress}
          >
            <Text style={styles.profileText}>{userInitials}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            styles.balance,
            showBack && styles.balanceWithBack,
            !showProfile && !showBack && styles.balanceOnly
          ]}
          onPress={() => setShowStatsModal(true)}
        >
          <Image
            source={require('../assets/logo.png')}
            style={styles.coinIcon}
            resizeMode="contain"
          />
          <Text style={styles.balanceText}>{userStats.currentBalance.toFixed(2)}</Text>
        </TouchableOpacity>
      </View>
      <StatsModal
        visible={showStatsModal}
        onClose={() => setShowStatsModal(false)}
        stats={userStats}
      />
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    marginTop: 40,
  },
  headerWithBack: {
    justifyContent: 'flex-start',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.round,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.round,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  profileText: {
    ...typography.body,
    fontWeight: '600',
  },
  balance: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
    marginTop: 40,
  },
  balanceWithBack: {
    marginLeft: 'auto', // Push to right when back button is present
  },
  balanceOnly: {
    marginLeft: 'auto', // Push to right when it's the only element
  },
  coinIcon: {
    width: 20,
    height: 20,
    marginRight: spacing.xs,
  },
  balanceText: {
    ...typography.body,
    fontWeight: '600',
  },
});

export default Header; 