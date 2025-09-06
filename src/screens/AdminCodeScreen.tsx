import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import {
  initializeCodeDatabase,
  addCodesToDatabase,
  getCodeDatabaseStats,
  clearAllCodeData,
  getAvailableCodes,
  getAssignedCodes,
  autoInitializeYourCodes
} from '../utils/codeManager';
import {
  getGiftCardWins,
  updateGiftCardWinStatus
} from '../utils/scratchCardManager';

const AdminCodeScreen = () => {
  const [newCodes, setNewCodes] = useState('');
  const [stats, setStats] = useState({
    availableCount: 0,
    assignedCount: 0,
    usedCount: 0
  });
  const [availableCodes, setAvailableCodes] = useState<string[]>([]);
  const [assignedCodes, setAssignedCodes] = useState<any[]>([]);
  const [showCodes, setShowCodes] = useState(false);
  const [giftCardWins, setGiftCardWins] = useState<any[]>([]);
  const [showGiftCards, setShowGiftCards] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const codeStats = await getCodeDatabaseStats();
      setStats(codeStats);
      
      const availableCodesData = await getAvailableCodes();
      setAvailableCodes(availableCodesData.map(c => c.code));
      
      const assignedCodesData = await getAssignedCodes();
      setAssignedCodes(assignedCodesData);

      // Load gift card wins
      const giftCardWinsData = await getGiftCardWins();
      setGiftCardWins(giftCardWinsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleInitializeCodes = async () => {
    if (!newCodes.trim()) {
      Alert.alert('Error', 'Please enter codes to initialize the database.');
      return;
    }

    const codesArray = newCodes
      .split('\n')
      .map(code => code.trim())
      .filter(code => code.length > 0);

    if (codesArray.length === 0) {
      Alert.alert('Error', 'No valid codes found.');
      return;
    }

    Alert.alert(
      'Confirm',
      `This will initialize the database with ${codesArray.length} codes. Continue?`,
      [
        { text: 'Cancel' },
        {
          text: 'Initialize',
          onPress: async () => {
            const success = await initializeCodeDatabase(codesArray);
            if (success) {
              Alert.alert('Success', `Database initialized with ${codesArray.length} codes.`);
              setNewCodes('');
              loadStats();
            } else {
              Alert.alert('Error', 'Failed to initialize database.');
            }
          }
        }
      ]
    );
  };

  const handleAddCodes = async () => {
    if (!newCodes.trim()) {
      Alert.alert('Error', 'Please enter codes to add to the database.');
      return;
    }

    const codesArray = newCodes
      .split('\n')
      .map(code => code.trim())
      .filter(code => code.length > 0);

    if (codesArray.length === 0) {
      Alert.alert('Error', 'No valid codes found.');
      return;
    }

    const success = await addCodesToDatabase(codesArray);
    if (success) {
      Alert.alert('Success', `Added codes to database.`);
      setNewCodes('');
      loadStats();
    } else {
      Alert.alert('Error', 'Failed to add codes to database.');
    }
  };

  const handleClearDatabase = () => {
    Alert.alert(
      'Warning',
      'This will permanently delete all code data. This action cannot be undone.',
      [
        { text: 'Cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            const success = await clearAllCodeData();
            if (success) {
              Alert.alert('Success', 'All code data has been cleared.');
              loadStats();
            } else {
              Alert.alert('Error', 'Failed to clear code data.');
            }
          }
        }
      ]
    );
  };

  const handleMarkGiftCardSent = async (winId: string) => {
    Alert.alert(
      'Mark as Sent',
      'Mark this gift card as sent to the user?',
      [
        { text: 'Cancel' },
        {
          text: 'Mark Sent',
          onPress: async () => {
            const success = await updateGiftCardWinStatus(winId, 'sent', 'Manually sent by admin');
            if (success) {
              Alert.alert('Success', 'Gift card marked as sent!');
              loadStats();
            } else {
              Alert.alert('Error', 'Failed to update status.');
            }
          }
        }
      ]
    );
  };

  const pendingGiftCards = giftCardWins.filter(win => win.status === 'pending');
  const sentGiftCards = giftCardWins.filter(win => win.status === 'sent');

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
            <Text style={styles.title}>Admin - Promo Codes</Text>
          </View>

          {/* Stats Section */}
          <View style={styles.statsContainer}>
            <Text style={styles.sectionTitle}>Database Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.availableCount}</Text>
                <Text style={styles.statLabel}>Available</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.assignedCount}</Text>
                <Text style={styles.statLabel}>Assigned</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.usedCount}</Text>
                <Text style={styles.statLabel}>Used</Text>
              </View>
            </View>
          </View>

          {/* Quick Setup */}
          <TouchableOpacity 
            style={styles.quickSetupButton}
            onPress={() => setNewCodes('DIGI34\nFREO2\nLPOS4\nDIGI56\nFREO7\nLPOS9\nDIGI78\nFREO12\nLPOS15\nDIGI90')}
          >
            <Ionicons name="flash" size={20} color={colors.primary} />
            <Text style={styles.quickSetupText}>Quick Setup - Sample Codes
 
            </Text>
          </TouchableOpacity>

          {/* Input Section */}
          <View style={styles.inputSection}>
            <Text style={styles.sectionTitle}>Add Promo Codes</Text>
            <Text style={styles.description}>
              Enter one promo code per line. Format like: DIGI34, FREO2, LPOS4, etc.
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder="DIGI34&#10;FREO2&#10;LPOS4&#10;(one per line)..."
              placeholderTextColor={colors.textSecondary}
              value={newCodes}
              onChangeText={setNewCodes}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.autoInitButton]} 
              onPress={async () => {
                const success = await autoInitializeYourCodes();
                if (success) {
                  Alert.alert('Success', 'Your promo codes have been automatically initialized!');
                  loadStats();
                } else {
                  Alert.alert('Info', 'Codes are already initialized or failed to initialize.');
                }
              }}
            >
              <Ionicons name="rocket" size={20} color={colors.background} />
              <Text style={styles.buttonText}>Auto-Initialize My Codes</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.primaryButton]} 
              onPress={handleInitializeCodes}
            >
              <Ionicons name="create" size={20} color={colors.background} />
              <Text style={styles.buttonText}>Initialize Database</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.secondaryButton]} 
              onPress={handleAddCodes}
            >
              <Ionicons name="add" size={20} color={colors.text} />
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>Add to Database</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.dangerButton]} 
              onPress={handleClearDatabase}
            >
              <Ionicons name="trash" size={20} color={colors.text} />
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>Clear All Data</Text>
            </TouchableOpacity>
          </View>

          {/* View Codes Section */}
          <TouchableOpacity 
            style={styles.toggleButton}
            onPress={() => setShowCodes(!showCodes)}
          >
            <Text style={styles.toggleButtonText}>
              {showCodes ? 'Hide Code Details' : 'Show Code Details'}
            </Text>
            <Ionicons 
              name={showCodes ? 'chevron-up' : 'chevron-down'} 
              size={20} 
              color={colors.primary} 
            />
          </TouchableOpacity>

          {showCodes && (
            <View style={styles.codesSection}>
              <View style={styles.codesList}>
                <Text style={styles.codesTitle}>Available Codes ({availableCodes.length})</Text>
                <ScrollView style={styles.codesScrollView} nestedScrollEnabled>
                  {availableCodes.map((code, index) => (
                    <Text key={index} style={styles.codeItem}>{code}</Text>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.codesList}>
                <Text style={styles.codesTitle}>Assigned Codes ({assignedCodes.length})</Text>
                <ScrollView style={styles.codesScrollView} nestedScrollEnabled>
                  {assignedCodes.map((codeData, index) => (
                    <View key={index} style={styles.assignedCodeItem}>
                      <Text style={styles.codeItem}>{codeData.code}</Text>
                      <Text style={styles.codeUser}>User: {codeData.userId}</Text>
                      <Text style={styles.codeStatus}>
                        {codeData.isUsed ? 'Used' : 'Unused'}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            </View>
          )}

          {/* GIFT CARD WINS SECTION */}
          <TouchableOpacity 
            style={[styles.toggleButton, { backgroundColor: pendingGiftCards.length > 0 ? '#FF6B35' : colors.surface }]}
            onPress={() => setShowGiftCards(!showGiftCards)}
          >
            <Text style={[styles.toggleButtonText, { color: pendingGiftCards.length > 0 ? colors.background : colors.primary }]}>
              {showGiftCards ? 'Hide Gift Card Wins' : `Gift Card Wins (${pendingGiftCards.length} pending)`}
            </Text>
            <Ionicons 
              name={showGiftCards ? 'chevron-up' : 'chevron-down'} 
              size={20} 
              color={pendingGiftCards.length > 0 ? colors.background : colors.primary}
            />
          </TouchableOpacity>

          {showGiftCards && (
            <View style={styles.codesSection}>
              <View style={styles.codesList}>
                <Text style={styles.codesTitle}>Pending Gift Cards ({pendingGiftCards.length})</Text>
                <ScrollView style={styles.codesScrollView} nestedScrollEnabled>
                  {pendingGiftCards.length === 0 ? (
                    <Text style={styles.noDataText}>No pending gift cards!</Text>
                  ) : (
                    pendingGiftCards.map((win, index) => (
                      <View key={index} style={[styles.assignedCodeItem, { backgroundColor: '#FF6B35', opacity: 0.9 }]}>
                        <Text style={[styles.codeItem, { color: colors.background, fontWeight: 'bold' }]}>
                          ${win.amount} Amazon Gift Card
                        </Text>
                        <Text style={[styles.codeUser, { color: colors.background }]}>
                          User: {win.userId || 'Unknown'} | Email: {win.email || 'Unknown'}
                        </Text>
                        <Text style={[styles.codeUser, { color: colors.background }]}>
                          Won: {new Date(win.timestamp).toLocaleString()}
                        </Text>
                        <TouchableOpacity 
                          style={styles.markSentButton}
                          onPress={() => handleMarkGiftCardSent(win.id)}
                        >
                          <Text style={styles.markSentButtonText}>Mark as Sent</Text>
                        </TouchableOpacity>
                      </View>
                    ))
                  )}
                </ScrollView>
              </View>

              <View style={styles.codesList}>
                <Text style={styles.codesTitle}>Sent Gift Cards ({sentGiftCards.length})</Text>
                <ScrollView style={styles.codesScrollView} nestedScrollEnabled>
                  {sentGiftCards.map((win, index) => (
                    <View key={index} style={styles.assignedCodeItem}>
                      <Text style={styles.codeItem}>${win.amount} Amazon Gift Card</Text>
                      <Text style={styles.codeUser}>User: {win.userId || 'Unknown'}</Text>
                      <Text style={styles.codeStatus}>Sent</Text>
                      <Text style={styles.codeUser}>
                        Won: {new Date(win.timestamp).toLocaleDateString()}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            </View>
          )}
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
    ...typography.h1,
  },
  statsContainer: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  statNumber: {
    ...typography.h2,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
  },
  inputSection: {
    marginBottom: spacing.xl,
  },
  description: {
    ...typography.caption,
    marginBottom: spacing.md,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.body,
    minHeight: 150,
  },
  buttonContainer: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
  },
  dangerButton: {
    backgroundColor: colors.error,
  },
  buttonText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.background,
  },
  secondaryButtonText: {
    color: colors.text,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  toggleButtonText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  codesSection: {
    gap: spacing.md,
  },
  codesList: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  codesTitle: {
    ...typography.h3,
    marginBottom: spacing.sm,
  },
  codesScrollView: {
    maxHeight: 200,
  },
  codeItem: {
    ...typography.body,
    fontFamily: 'monospace',
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  assignedCodeItem: {
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  codeUser: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  codeStatus: {
    ...typography.caption,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  quickSetupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  quickSetupText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  autoInitButton: {
    backgroundColor: colors.success,
  },
  markSentButton: {
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
    alignItems: 'center',
  },
  markSentButtonText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: 'bold',
  },
  noDataText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    padding: spacing.lg,
  },
});

export default AdminCodeScreen; 