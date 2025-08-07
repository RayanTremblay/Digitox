import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated, ScrollView, Modal, TouchableWithoutFeedback, TextInput, AppState, Alert } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Svg, { Circle, G } from 'react-native-svg';
import Header from '../components/Header';
import { getDetoxStats, updateDetoxStats, checkAndResetDailyStats } from '../utils/storage';
import { shouldApplyBoostMultiplier } from '../utils/boostManager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../types/navigation';
import notificationService from '../services/notificationService';
import achievementService from '../services/achievementService';
import AchievementModal from '../components/AchievementModal';

// Constants for boost feature
const BOOST_THRESHOLD_MINUTES = 180; // 3 hours
const BASE_COIN_RATE = 0.016666667; // 1 coin per hour (1/60 per minute)

type NavigationProp = StackNavigationProp<RootStackParamList>;

const CIRCLE_LENGTH = 800;
const CIRCLE_RADIUS = CIRCLE_LENGTH / (2 * Math.PI);

const DURATION_OPTIONS = [
  { label: '15 minutes', value: 15 * 60 },
  { label: '30 minutes', value: 30 * 60 },
  { label: '1 hour', value: 60 * 60 },
  { label: '2 hours', value: 120 * 60 },
  { label: '4 hours', value: 240 * 60 },
      { label: 'Custom duration', value: 'custom' },
];

const formatLongTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours === 0) {
    return `${minutes} minutes`;
  } else if (minutes === 0) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  } else {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ${minutes} minutes`;
  }
};

const DetoxScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [progress] = useState(new Animated.Value(0));
  const [earnedDetoxcoins, setEarnedDetoxcoins] = useState(0);
  const [showDurationModal, setShowDurationModal] = useState(true);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [showCustomDurationModal, setShowCustomDurationModal] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(60 * 60);
  const [customHours, setCustomHours] = useState('');
  const [customMinutes, setCustomMinutes] = useState('');
  const [isScreenDark, setIsScreenDark] = useState(false);
  const screenOpacity = useState(new Animated.Value(0))[0];
  const hoursInputRef = useRef<TextInput>(null);
  const minutesInputRef = useRef<TextInput>(null);
  const [boostMultiplier, setBoostMultiplier] = useState(1);
  const [dailyTimeOffMinutes, setDailyTimeOffMinutes] = useState(0);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [currentAchievement, setCurrentAchievement] = useState<any>(null);
  const [appStateChangeTime, setAppStateChangeTime] = useState<number | null>(null);
  const [showSessionInterruptedModal, setShowSessionInterruptedModal] = useState(false);
  const [interruptedSessionData, setInterruptedSessionData] = useState<{timeCompleted: string, coinsEarned: string} | null>(null);

  useEffect(() => {
    // Load daily stats to check for boost multiplier
    const loadStats = async () => {
      const stats = await getDetoxStats();
      const minutes = Math.floor(stats.dailyTimeSaved / 60);
      setDailyTimeOffMinutes(minutes);
      
      // Update boost multiplier using new logic (considers both ad boost and time boost)
      const boostResult = await shouldApplyBoostMultiplier(minutes);
      setBoostMultiplier(boostResult.multiplier);
    };
    
    loadStats();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive) {
      interval = setInterval(async () => {
        setTimeElapsed((prev) => {
          const newTime = prev + 1;
          
          // Calculate boost multiplier asynchronously
          const updateBoostAndCoins = async () => {
            const totalMinutes = (dailyTimeOffMinutes + newTime / 60);
            const boostResult = await shouldApplyBoostMultiplier(totalMinutes);
            const currentBoost = boostResult.multiplier;
            
            // Apply the boost multiplier
            const newEarnedDetoxcoins = (newTime / 60) * BASE_COIN_RATE * currentBoost;
            
            if (Math.abs(newEarnedDetoxcoins - earnedDetoxcoins) >= 0.01) {
              setEarnedDetoxcoins(Number(newEarnedDetoxcoins.toFixed(2)));
              
              // Update boost multiplier if it changed
              if (currentBoost !== boostMultiplier) {
                setBoostMultiplier(currentBoost);
              }
            }
          };
          
          updateBoostAndCoins();
          
          // Auto-end detox when duration is reached
          if (newTime >= selectedDuration) {
            handleEndDetox();
          }
          
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, earnedDetoxcoins, selectedDuration, dailyTimeOffMinutes, boostMultiplier]);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: timeElapsed / selectedDuration,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [timeElapsed, selectedDuration]);

  useEffect(() => {
    let screenTimeout: NodeJS.Timeout;
    if (isActive) {
      screenTimeout = setTimeout(() => {
        fadeToBlack();
      }, 60000);
    }
    return () => clearTimeout(screenTimeout);
  }, [isActive]);

  // 🔒 APP STATE MONITORING - End detox session if user quits the app
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (isActive) {
        if (nextAppState === 'background' || nextAppState === 'inactive') {
          // User is leaving the app during detox session
          setAppStateChangeTime(Date.now());
          
          // Force end the session immediately to prevent cheating
          setIsActive(false);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
    };
  }, [isActive, timeElapsed, earnedDetoxcoins]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleStartDetox = (duration: number | string) => {
    console.log('Selected duration:', duration, typeof duration);
    
    if (duration === 'custom') {
      console.log('Opening custom duration modal');
      setShowDurationModal(false);
      setTimeout(() => {
        setShowCustomDurationModal(true);
      }, 300);
      return;
    }
    
    setSelectedDuration(duration as number);
    setShowDurationModal(false);
    setShowInstructionsModal(true);
  };

  const handleCustomDurationConfirm = () => {
    const hours = parseInt(customHours || '0', 10);
    const minutes = parseInt(customMinutes || '0', 10);
    
    if (hours === 0 && minutes === 0) {
      // Invalid input
      return;
    }
    
    const totalSeconds = (hours * 60 * 60) + (minutes * 60);
    setSelectedDuration(totalSeconds);
    setShowCustomDurationModal(false);
    setShowDurationModal(false);
    setShowInstructionsModal(true);
    
    // Reset inputs
    setCustomHours('');
    setCustomMinutes('');
  };

  const handleConfirmInstructions = async () => {
    // Check for midnight reset before starting
    await checkAndResetDailyStats();
    
    setShowInstructionsModal(false);
    setIsActive(true);
    setAppStateChangeTime(null); // Reset app state tracking when starting session
  };

  // Add pause/resume functionality - toggle between pause and resume
  const handlePauseDetox = () => {
    setIsActive(!isActive);
  };

  // Handle session interrupted modal actions
  const handleSaveProgressAndExit = () => {
    setShowSessionInterruptedModal(false);
    handleEndDetox();
  };

  const handleStartNewSession = () => {
    setShowSessionInterruptedModal(false);
    // Save progress first, then restart
    updateDetoxStats(Number(interruptedSessionData?.coinsEarned || 0), timeElapsed).then(() => {
      // Reset for new session
      setTimeElapsed(0);
      setEarnedDetoxcoins(0);
      setShowDurationModal(true);
    });
  };

  const handleEndDetox = async () => {
    setIsActive(false);
    
    // Update stats with earned Detoxcoins and time
    if (timeElapsed > 0) {
      await updateDetoxStats(earnedDetoxcoins, timeElapsed);
      
      // Send congratulatory notification for completing a detox session
      if (timeElapsed >= 300) { // 5 minutes or more
        const sessionMinutes = Math.floor(timeElapsed / 60);
        
        // Send immediate congratulatory notification
        try {
          await notificationService.sendImmediateEncouragement();
        } catch (error) {
          console.error('Failed to send congratulatory notification:', error);
        }

        // Check for achievements
        try {
          const newAchievements = await achievementService.checkSessionAchievements(sessionMinutes);
          if (newAchievements.length > 0) {
            // Show the first new achievement
            setCurrentAchievement(newAchievements[0]);
            setShowAchievementModal(true);
          }
        } catch (error) {
          console.error('Failed to check achievements:', error);
        }
      }
    }
    
    setTimeElapsed(0);
    setEarnedDetoxcoins(0);
    setAppStateChangeTime(null); // Reset app state tracking
    navigation.navigate('MainTabs');
  };

  const fadeToBlack = () => {
    setIsScreenDark(true);
    Animated.timing(screenOpacity, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  };

  const fadeFromBlack = () => {
    Animated.timing(screenOpacity, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      setIsScreenDark(false);
      if (isActive) {
        setTimeout(() => {
          fadeToBlack();
        }, 60000);
      }
    });
  };

  // Check for midnight reset during active detox
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (isActive) {
      intervalId = setInterval(() => {
        checkAndResetDailyStats().then(async () => {
          // If a reset happened, we'll get new stats
          const stats = await getDetoxStats();
          if (stats.dailyTimeSaved === 0 && timeElapsed > 0) {
            // If dailyTimeSaved is reset to 0 but we have time elapsed,
            // we need to update the stats with our current session
            await updateDetoxStats(earnedDetoxcoins, timeElapsed);
          }
        });
      }, 60000); // Check every minute
    }
    
    return () => clearInterval(intervalId);
  }, [isActive, timeElapsed, earnedDetoxcoins]);

  // 🔒 APP STATE MONITORING - End detox session if user quits the app
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (isActive) {
        if (nextAppState === 'background' || nextAppState === 'inactive') {
          // User is leaving the app during detox session
          setAppStateChangeTime(Date.now());
          
          // Force end the session immediately to prevent cheating
          setIsActive(false);
          
          // Show custom modal when they return to the app
          setTimeout(() => {
            setInterruptedSessionData({
              timeCompleted: formatTime(timeElapsed),
              coinsEarned: earnedDetoxcoins.toFixed(2)
            });
            setShowSessionInterruptedModal(true);
          }, 500); // Small delay to ensure app is back in foreground
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
    };
  }, [isActive, timeElapsed, earnedDetoxcoins]);

  return (
    <View style={styles.container}>
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
            <Header showProfile={false} />
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Detoxcoin</Text>
            </View>

            <View style={styles.mainContent}>
              <View style={styles.timerSection}>
                <View style={styles.timerContainer}>
                  <View style={styles.progressContainer}>
                    <Svg width={CIRCLE_RADIUS * 2 + 20} height={CIRCLE_RADIUS * 2 + 20}>
                      <G rotation="-90" origin={`${CIRCLE_RADIUS + 10}, ${CIRCLE_RADIUS + 10}`}>
                        <Circle
                          cx={CIRCLE_RADIUS + 10}
                          cy={CIRCLE_RADIUS + 10}
                          r={CIRCLE_RADIUS}
                          stroke={colors.surface}
                          strokeWidth="15"
                          fill="transparent"
                        />
                        <AnimatedCircle
                          cx={CIRCLE_RADIUS + 10}
                          cy={CIRCLE_RADIUS + 10}
                          r={CIRCLE_RADIUS}
                          stroke={colors.primary}
                          strokeWidth="15"
                          fill="transparent"
                          strokeDasharray={CIRCLE_LENGTH}
                          strokeDashoffset={progress.interpolate({
                            inputRange: [0, 1],
                            outputRange: [CIRCLE_LENGTH, 0],
                          })}
                        />
                      </G>
                    </Svg>
                    <View style={styles.timerContent}>
                      <Image
                        source={require('../assets/logo.png')}
                        style={styles.centerIcon}
                        resizeMode="contain"
                      />
                      <Text style={styles.timerText}>{formatTime(timeElapsed)}</Text>
                      <Text style={styles.timerLabel}>Time off phone</Text>
                      <Text style={styles.durationLabel}>
                        Target: {formatTime(selectedDuration)}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.rewardContainer}>
                  <Image
                    source={require('../assets/logo.png')}
                    style={styles.smallCoinIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.rewardText}>+{earnedDetoxcoins.toFixed(2)}</Text>
                  {boostMultiplier > 1 && (
                    <View style={styles.boostBadge}>
                      <Text style={styles.boostBadgeText}>{boostMultiplier}x</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.instructionsContainer}>
                <Text style={styles.instructionsTitle}>Important Instructions</Text>
                <Text style={styles.instructionsText}>
                  To ensure accurate tracking of your digital detox time:
                </Text>
                <View style={styles.instructionsList}>
                  <Text style={styles.instructionItem}>• Keep the app open and your phone unlocked</Text>
                  <Text style={styles.instructionItem}>• After 1 minute, the screen will dim to save battery</Text>
                  <Text style={styles.instructionItem}>• Due to iOS limitations, we cannot track when the app is closed or the phone is locked</Text>
                  <Text style={styles.instructionItem}>• 🔒 Your session will automatically end if you leave the app</Text>
                  <Text style={styles.instructionItem}>• You'll receive rewards for the time spent in detox until the session ends</Text>
                </View>
              </View>

              {(isActive || timeElapsed > 0) && (
                <View style={styles.buttonContainer}>
                  <TouchableOpacity style={styles.pauseButton} onPress={handlePauseDetox}>
                    <Text style={styles.pauseButtonText}>
                      {isActive ? '⏸️ Pause' : '▶️ Resume'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.endButton} onPress={handleEndDetox}>
                    <Text style={styles.endButtonText}>🔚 End Detox</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Black screen overlay with touch handler */}
        <TouchableWithoutFeedback onPress={() => isScreenDark && fadeFromBlack()}>
          <Animated.View 
            style={[
              styles.blackScreen,
              {
                opacity: screenOpacity,
                pointerEvents: isScreenDark ? 'auto' : 'none'
              }
            ]}
          >
            <View style={styles.fullScreen} />
          </Animated.View>
        </TouchableWithoutFeedback>

        {/* Duration Selection Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showDurationModal}
          onRequestClose={() => setShowDurationModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Choose Detox Duration</Text>
              {DURATION_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value.toString()}
                  style={[
                    styles.durationOption,
                    option.value === 'custom' && styles.customDurationOption
                  ]}
                  onPress={() => handleStartDetox(option.value)}
                >
                  <Text style={styles.durationText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>

        {/* Custom Duration Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={showCustomDurationModal}
          onRequestClose={() => setShowCustomDurationModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { zIndex: 999 }]}>
              <Text style={styles.modalTitle}>Set Custom Duration</Text>
              
              <View style={styles.customDurationInputs}>
                <View style={styles.inputContainer}>
                  <TextInput
                    ref={hoursInputRef}
                    style={styles.durationInput}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor="#888"
                    value={customHours}
                    onChangeText={setCustomHours}
                    maxLength={2}
                    onSubmitEditing={() => minutesInputRef.current?.focus()}
                  />
                  <Text style={styles.durationInputLabel}>Hours</Text>
                </View>
                
                <View style={styles.inputContainer}>
                  <TextInput
                    ref={minutesInputRef}
                    style={styles.durationInput}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor="#888"
                    value={customMinutes}
                    onChangeText={setCustomMinutes}
                    maxLength={2}
                  />
                  <Text style={styles.durationInputLabel}>Minutes</Text>
                </View>
              </View>
              
              <View style={styles.customDurationButtons}>
                <TouchableOpacity
                  style={[styles.customDurationButton, styles.cancelButton]}
                  onPress={() => {
                    console.log('Cancelling custom duration');
                    setShowCustomDurationModal(false);
                    navigation.navigate('MainTabs');
                  }}
                >
                  <Text style={styles.customDurationButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.customDurationButton, styles.customConfirmButton]}
                  onPress={() => {
                    console.log('Confirming custom duration');
                    handleCustomDurationConfirm();
                  }}
                >
                  <Text style={styles.customDurationButtonText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Instructions Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showInstructionsModal}
          onRequestClose={() => setShowInstructionsModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, styles.instructionsModalContent]}>
              <Text style={styles.modalTitle}>Important Instructions</Text>
              <Text style={styles.modalInstructionsText}>
                To ensure accurate tracking of your digital detox time:
              </Text>
              <View style={styles.modalInstructionsList}>
                <Text style={styles.modalInstructionItem}>• Keep the app open and your phone unlocked</Text>
                <Text style={styles.modalInstructionItem}>• After 1 minute, the screen will dim to save battery</Text>
                <Text style={styles.modalInstructionItem}>• Due to iOS limitations, we cannot track when the app is closed or the phone is locked</Text>
                <Text style={styles.modalInstructionItem}>• Your session will end if you close the app or lock your phone</Text>
                <Text style={styles.modalInstructionItem}>• You'll receive rewards for the time spent in detox until the session ends</Text>
              </View>
              <TouchableOpacity 
                style={styles.confirmButton} 
                onPress={handleConfirmInstructions}
              >
                <Text style={styles.confirmButtonText}>I Understand, Start Detox</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Achievement Modal */}
                <AchievementModal 
          visible={showAchievementModal}
          achievement={currentAchievement}
          onClose={() => {
            setShowAchievementModal(false);
            setCurrentAchievement(null);
          }}
        />

        {/* Session Interrupted Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={showSessionInterruptedModal}
          onRequestClose={() => {}} // Prevent closing with back button
        >
          <View style={styles.interruptedModalOverlay}>
            <View style={styles.interruptedModalContent}>
              {/* Warning Icon */}
              <View style={styles.warningIconContainer}>
                <Text style={styles.warningIcon}>🚨</Text>
              </View>

              {/* Title */}
              <Text style={styles.interruptedModalTitle}>Session Interrupted</Text>
              
              {/* Description */}
              <Text style={styles.interruptedModalDescription}>
                Your detox session was automatically ended because you left the app during your digital detox.
              </Text>

              {/* Stats Container */}
              <View style={styles.interruptedStatsContainer}>
                <View style={styles.statRow}>
                  <Text style={styles.statIcon}>⏱️</Text>
                  <Text style={styles.statLabel}>Time completed:</Text>
                  <Text style={styles.statValue}>{interruptedSessionData?.timeCompleted}</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statIcon}>💰</Text>
                  <Text style={styles.statLabel}>Detoxcoins earned:</Text>
                  <Text style={styles.statValue}>{interruptedSessionData?.coinsEarned}</Text>
                </View>
              </View>

              {/* Reminder Text */}
              <Text style={styles.interruptedReminderText}>
                🔒 For an effective digital detox, please stay within the app during your session.
              </Text>

              {/* Action Buttons */}
              <View style={styles.interruptedButtonContainer}>
                <TouchableOpacity 
                  style={styles.saveProgressButton}
                  onPress={handleSaveProgressAndExit}
                >
                  <Text style={styles.saveProgressButtonText}>💾 Save Progress & Exit</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.newSessionButton}
                  onPress={handleStartNewSession}
                >
                  <Text style={styles.newSessionButtonText}>🔄 Start New Session</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </View>
  );
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

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
  mainContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  timerSection: {
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  progressContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: CIRCLE_RADIUS * 2 + 20,
    height: CIRCLE_RADIUS * 2 + 20,
  },
  timerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: CIRCLE_RADIUS * 2,
    height: CIRCLE_RADIUS * 2,
    top: 10,
    left: 10,
  },
  centerIcon: {
    width: 50,
    height: 50,
    marginBottom: spacing.sm,
  },
  timerText: {
    ...typography.h1,
    fontSize: 32,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  timerLabel: {
    ...typography.body,
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  instructionsContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: spacing.xl,
  },
  instructionsTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  instructionsText: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  instructionsList: {
    marginTop: spacing.xs,
  },
  instructionItem: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  pauseButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.round,
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  pauseButtonText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  endButton: {
    backgroundColor: '#FF4444',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.round,
    alignItems: 'center',
    flex: 1,
    marginLeft: spacing.sm,
  },
  endButtonText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    marginTop: spacing.md,
    position: 'relative',
  },
  smallCoinIcon: {
    width: 24,
    height: 24,
    marginRight: spacing.sm,
  },
  rewardText: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    ...typography.h2,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: spacing.xl,
    fontWeight: '600',
  },
  durationOption: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.round,
    marginBottom: spacing.md,
  },
  customDurationOption: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  durationText: {
    ...typography.body,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
  },
  durationLabel: {
    ...typography.body,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  instructionsModalContent: {
    maxHeight: '80%',
  },
  modalInstructionsText: {
    ...typography.body,
    color: '#FFFFFF',
    marginBottom: spacing.md,
    fontSize: 16,
  },
  modalInstructionsList: {
    marginBottom: spacing.xl,
  },
  modalInstructionItem: {
    ...typography.body,
    color: '#E0E0E0',
    marginBottom: spacing.sm,
    lineHeight: 24,
    fontSize: 15,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.round,
    marginTop: spacing.md,
  },
  confirmButtonText: {
    ...typography.body,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
  blackScreen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    zIndex: 999,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: 'black',
  },
  customDurationInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  inputContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: spacing.sm,
  },
  durationInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    width: '100%',
    height: 60,
    borderRadius: borderRadius.md,
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  durationInputLabel: {
    ...typography.body,
    color: '#CCCCCC',
    fontSize: 14,
  },
  customDurationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  customDurationButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.round,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  customConfirmButton: {
    backgroundColor: colors.primary,
  },
  customDurationButtonText: {
    ...typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  boostBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  boostBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  // Session Interrupted Modal Styles
  interruptedModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  interruptedModalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  warningIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  warningIcon: {
    fontSize: 40,
  },
  interruptedModalTitle: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
    fontWeight: '700',
  },
  interruptedModalDescription: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  interruptedStatsContainer: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    width: '100%',
    marginBottom: spacing.lg,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statIcon: {
    fontSize: 20,
    width: 30,
  },
  statLabel: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
    marginLeft: spacing.sm,
  },
  statValue: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  interruptedReminderText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    fontStyle: 'italic',
  },
  interruptedButtonContainer: {
    width: '100%',
    gap: spacing.md,
  },
  saveProgressButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.round,
    alignItems: 'center',
  },
  saveProgressButtonText: {
    ...typography.body,
    color: colors.background,
    fontWeight: '600',
    fontSize: 16,
  },
  newSessionButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.round,
    alignItems: 'center',
  },
  newSessionButtonText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
    fontSize: 16,
  },
});

export default DetoxScreen; 