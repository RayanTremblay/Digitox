import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types/navigation';

type NavigationProp = StackNavigationProp<RootStackParamList>;

const HelpSupportScreen = () => {
  const navigation = useNavigation<NavigationProp>();

  const handleEmailPress = () => {
    Linking.openURL('mailto:support@detoxly.app');
  };

  const handleWebsitePress = () => {
    Linking.openURL('https://detoxly.app/support');
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
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Help & Support</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Getting Started</Text>
            <Text style={styles.text}>
              • Set your daily detox goal
              • Start a detox session
              • Track your progress
              • Earn Detoxcoins
              • Build your streak
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
            <View style={styles.faqItem}>
              <Text style={styles.question}>How do detox sessions work?</Text>
              <Text style={styles.answer}>
                Detox sessions track your time away from your phone. Start a session when you want to take a break, and the app will monitor your progress.
              </Text>
            </View>
            <View style={styles.faqItem}>
              <Text style={styles.question}>How are Detoxcoins earned?</Text>
              <Text style={styles.answer}>
                Detoxcoins are earned by completing detox sessions and achieving daily goals. The longer your sessions and the more consistent you are, the more you earn.
              </Text>
            </View>
            <View style={styles.faqItem}>
              <Text style={styles.question}>What happens if I break my streak?</Text>
              <Text style={styles.answer}>
                Your streak resets to 0, but your total detox time and Detoxcoins remain. Start a new streak by completing your daily goal.
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Us</Text>
            <TouchableOpacity 
              style={styles.contactButton}
              onPress={handleEmailPress}
            >
              <Ionicons name="mail-outline" size={20} color={colors.primary} />
              <Text style={styles.contactButtonText}>Email Support</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.contactButton}
              onPress={handleWebsitePress}
            >
              <Ionicons name="globe-outline" size={20} color={colors.primary} />
              <Text style={styles.contactButtonText}>Visit Support Website</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>App Version</Text>
            <Text style={styles.version}>1.0.0</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    marginTop: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.round,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  backButtonText: {
    fontSize: 32,
    color: colors.text,
    height: 40,
    width: 40,
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 40,
    includeFontPadding: false,
    fontWeight: 'bold',
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  text: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  faqItem: {
    marginBottom: spacing.md,
  },
  question: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  answer: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  contactButtonText: {
    ...typography.body,
    color: colors.primary,
    marginLeft: spacing.sm,
  },
  version: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default HelpSupportScreen; 