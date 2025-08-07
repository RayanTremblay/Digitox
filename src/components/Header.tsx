import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors, typography, spacing, borderRadius } from '../theme/theme';
import StatsModal from './StatsModal';
import { getDetoxStats } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';
import { getUserData } from '../../firebase/firestore';
import { generateInitials, generateInitialsFromDisplayName, generateInitialsFromEmail } from '../utils/userUtils';
import { RootStackParamList } from '../types/navigation';

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface HeaderProps {
  showBack?: boolean;
  showProfile?: boolean;
}

const Header: React.FC<HeaderProps> = ({ showBack = false, showProfile = true }) => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [userInitials, setUserInitials] = useState('U');
  const [stats, setStats] = useState({
    balance: 0,
    totalEarned: 0,
    totalTimeSaved: 0,
  });

  useEffect(() => {
    loadStats();
    loadUserData();
  }, [user]);

  useFocusEffect(
    React.useCallback(() => {
      loadStats();
      loadUserData();
      return () => {};
    }, [user])
  );

  const loadStats = async () => {
    const currentStats = await getDetoxStats();
    setStats(currentStats);
  };

  const loadUserData = async () => {
    if (!user) {
      setUserInitials('U');
      return;
    }

    try {
      const result = await getUserData(user.uid);
      if (result.success && result.data) {
        const userData = result.data;
        
        // Try to generate initials from firstName and lastName first
        if (userData.firstName && userData.lastName) {
          setUserInitials(generateInitials(userData.firstName, userData.lastName));
        }
        // Fallback to displayName
        else if (userData.displayName) {
          setUserInitials(generateInitialsFromDisplayName(userData.displayName));
        }
        // Fallback to email
        else if (user.email) {
          setUserInitials(generateInitialsFromEmail(user.email));
        }
        // Final fallback
        else {
          setUserInitials('U');
        }
      } else {
        // If no user data in Firestore, use email
        if (user.email) {
          setUserInitials(generateInitialsFromEmail(user.email));
        } else {
          setUserInitials('U');
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      // Fallback to email if available
      if (user.email) {
        setUserInitials(generateInitialsFromEmail(user.email));
      } else {
        setUserInitials('U');
      }
    }
  };

  return (
    <>
      <View style={[styles.header, showBack && styles.headerWithBack]}>
        {showBack && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.balance,
            showBack ? styles.balanceWithBack : !showProfile && styles.balanceOnly
          ]}
          onPress={() => setShowStatsModal(true)}
        >
          <Image
            source={require('../assets/logo.png')}
            style={styles.coinIcon}
            resizeMode="contain"
          />
          <Text style={styles.balanceText}>{stats.balance.toFixed(2)}</Text>
        </TouchableOpacity>

        {showProfile && (
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.profileText}>{userInitials}</Text>
          </TouchableOpacity>
        )}
      </View>

      <StatsModal
        visible={showStatsModal}
        onClose={() => setShowStatsModal(false)}
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