import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types/navigation';

type NavigationProp = StackNavigationProp<RootStackParamList>;

const PrivacyScreen = () => {
  const navigation = useNavigation<NavigationProp>();

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
            <Text style={styles.headerTitle}>Privacy Policy</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Collection</Text>
            <Text style={styles.text}>
              We collect minimal data necessary for the app's functionality:
              • Screen time usage
              • Detox session durations
              • App preferences
              • Achievement progress
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Usage</Text>
            <Text style={styles.text}>
              Your data is used solely to:
              • Track your digital wellness progress
              • Calculate rewards and achievements
              • Provide personalized insights
              • Improve app functionality
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Storage</Text>
            <Text style={styles.text}>
              • All data is stored locally on your device
              • No data is sent to external servers
              • You can delete all data at any time
              • Regular backups are recommended
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Rights</Text>
            <Text style={styles.text}>
              You have the right to:
              • Access your stored data
              • Delete your data
              • Export your data
              • Opt out of data collection
            </Text>
          </View>

          <TouchableOpacity style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={20} color={colors.error} />
            <Text style={styles.deleteButtonText}>Delete All Data</Text>
          </TouchableOpacity>
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
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  deleteButtonText: {
    ...typography.body,
    color: colors.error,
    marginLeft: spacing.sm,
  },
});

export default PrivacyScreen; 