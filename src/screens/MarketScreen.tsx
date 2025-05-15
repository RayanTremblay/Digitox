import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Header from '../components/Header';

type RootStackParamList = {
  MainTabs: undefined;
  Profile: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

const MarketScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const categories = ['Health', 'Gadgets', 'Finance'];

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
            <Text style={styles.title}>Digicoin</Text>
          </View>

          <Text style={styles.sectionTitle}>Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
            {categories.map((category) => (
              <TouchableOpacity key={category} style={styles.categoryButton}>
                <Text style={styles.categoryText}>{category}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.sectionTitle}>Gadgets</Text>
          
          <View style={styles.rewardCard}>
            <View style={styles.rewardHeader}>
              <Image
                source={require('../assets/logo.png')}
                style={styles.rewardIcon}
                resizeMode="contain"
              />
              <Text style={styles.rewardValue}>+1.00</Text>
            </View>
            <Text style={styles.rewardTitle}>Garmin</Text>
            <Text style={styles.rewardDescription}>Save 20% off on Garmin smartwatches and wearable ⌚</Text>
            <Text style={styles.rewardSubtext}>Beat yesterday with Garmin</Text>
          </View>

          <View style={styles.rewardCard}>
            <View style={styles.rewardHeader}>
              <Image
                source={require('../assets/logo.png')}
                style={styles.rewardIcon}
                resizeMode="contain"
              />
              <Text style={styles.rewardValue}>+2.00</Text>
            </View>
            <Text style={styles.rewardTitle}>Apple Watch</Text>
            <Text style={styles.rewardDescription}>Get 15% off on the latest Apple Watch Series ⌚</Text>
            <Text style={styles.rewardSubtext}>Track your fitness journey</Text>
          </View>

          <View style={styles.rewardCard}>
            <View style={styles.rewardHeader}>
              <Image
                source={require('../assets/logo.png')}
                style={styles.rewardIcon}
                resizeMode="contain"
              />
              <Text style={styles.rewardValue}>+1.50</Text>
            </View>
            <Text style={styles.rewardTitle}>Samsung Galaxy</Text>
            <Text style={styles.rewardDescription}>Save 10% on Samsung Galaxy smartphones 📱</Text>
            <Text style={styles.rewardSubtext}>Upgrade your mobile experience</Text>
          </View>
        </View>
      </ScrollView>
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
    ...typography.logo,
    textAlign: 'center',
    color: '#CCCCCC',
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
  categoryText: {
    ...typography.body,
    color: colors.text,
  },
  rewardCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },
  rewardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  rewardIcon: {
    width: 24,
    height: 24,
    marginRight: spacing.xs,
  },
  rewardValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  rewardTitle: {
    ...typography.h2,
    marginBottom: spacing.sm,
  },
  rewardDescription: {
    ...typography.body,
    marginBottom: spacing.xs,
  },
  rewardSubtext: {
    ...typography.caption,
  }
});

export default MarketScreen; 