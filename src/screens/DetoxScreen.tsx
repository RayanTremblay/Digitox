import React, { useState, useEffect, memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated, ScrollView, Modal, TouchableWithoutFeedback } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Svg, { Circle, G } from 'react-native-svg';
import Header from '../components/Header';

type RootStackParamList = {
  MainTabs: undefined;
  Profile: undefined;
  Detox: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

const CIRCLE_LENGTH = 800;
const CIRCLE_RADIUS = CIRCLE_LENGTH / (2 * Math.PI);

const DURATION_OPTIONS = [
  { label: '15 minutes', value: 15 * 60 },
  { label: '30 minutes', value: 30 * 60 },
  { label: '1 hour', value: 60 * 60 },
  { label: '2 hours', value: 120 * 60 },
  { label: '4 hours', value: 240 * 60 },
];

interface StatsModalProps {
  visible: boolean;
  onClose: () => void;
  stats: {
    currentBalance: number;
    totalEarned: number;
    totalTimeSaved: number;
  };
}

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

const StatsModal = memo(({ visible, onClose, stats }: StatsModalProps) => (
  <Modal
    animationType="slide"
    transparent={true}
    visible={visible}
    onRequestClose={onClose}
  >
    <View style={styles.modalOverlay}>
      <View style={[styles.modalContent, styles.statsModalContent]}>
        <View style={styles.statsHeader}>
          <Text style={styles.modalTitle}>Your Digicoin Stats</Text>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statItem}>
          <View style={styles.statIconContainer}>
            <Image
              source={require('../assets/logo.png')}
              style={styles.statIcon}
              resizeMode="contain"
            />
          </View>
          <View style={styles.statInfo}>
            <Text style={styles.statLabel}>Current Balance</Text>
            <Text style={styles.statValue}>{stats.currentBalance.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.statItem}>
          <View style={styles.statIconContainer}>
            <Image
              source={require('../assets/logo.png')}
              style={styles.statIcon}
              resizeMode="contain"
            />
          </View>
          <View style={styles.statInfo}>
            <Text style={styles.statLabel}>Total Earned</Text>
            <Text style={styles.statValue}>{stats.totalEarned.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.statItem}>
          <View style={styles.statIconContainer}>
            <Image
              source={require('../assets/logo.png')}
              style={styles.statIcon}
              resizeMode="contain"
            />
          </View>
          <View style={styles.statInfo}>
            <Text style={styles.statLabel}>Total Time Saved</Text>
            <Text style={styles.statValue}>{formatLongTime(stats.totalTimeSaved)}</Text>
          </View>
        </View>
      </View>
    </View>
  </Modal>
));

const DetoxScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [progress] = useState(new Animated.Value(0));
  const [earnedDigicoins, setEarnedDigicoins] = useState(0);
  const [showDurationModal, setShowDurationModal] = useState(true);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(60 * 60);
  const [isScreenDark, setIsScreenDark] = useState(false);
  const screenOpacity = useState(new Animated.Value(0))[0];

  // Mock data - In a real app, these would come from a backend/storage
  const userStats = {
    currentBalance: 150.88,
    totalEarned: 892.45,
    totalTimeSaved: 53460, // in seconds (about 14.85 hours)
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive) {
      interval = setInterval(() => {
        setTimeElapsed((prev) => {
          const newTime = prev + 1;
          // Calculate earned Digicoins (1 minute = 0.016666... Digicoins)
          const newEarnedDigicoins = (newTime / 60) * 0.016666667;
          if (Math.abs(newEarnedDigicoins - earnedDigicoins) >= 0.01) {
            setEarnedDigicoins(Number(newEarnedDigicoins.toFixed(2)));
          }
          
          // Auto-end detox when duration is reached
          if (newTime >= selectedDuration) {
            handleEndDetox();
          }
          
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, earnedDigicoins, selectedDuration]);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: timeElapsed / selectedDuration, // Progress based on selected duration
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [timeElapsed, selectedDuration]);

  useEffect(() => {
    let screenTimeout: NodeJS.Timeout;
    if (isActive) {
      // Set timeout to darken screen after 1 minute
      screenTimeout = setTimeout(() => {
        fadeToBlack();
      }, 60000);
    }
    return () => clearTimeout(screenTimeout);
  }, [isActive]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleStartDetox = (duration: number) => {
    setSelectedDuration(duration);
    setShowDurationModal(false);
    setShowInstructionsModal(true);
  };

  const handleConfirmInstructions = () => {
    setShowInstructionsModal(false);
    setIsActive(true);
  };

  const handleEndDetox = () => {
    setIsActive(false);
    setTimeElapsed(0);
    setEarnedDigicoins(0);
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
      // Reset the timer for screen darkening
      if (isActive) {
        setTimeout(() => {
          fadeToBlack();
        }, 60000);
      }
    });
  };

  const DurationModal = () => (
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
              key={option.value}
              style={styles.durationOption}
              onPress={() => handleStartDetox(option.value)}
            >
              <Text style={styles.durationText}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );

  const InstructionsModal = () => (
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
  );

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
              <Text style={styles.title}>Digicoin</Text>
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
                  <Text style={styles.rewardText}>+{earnedDigicoins.toFixed(2)}</Text>
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
                  <Text style={styles.instructionItem}>• Your session will end if you close the app or lock your phone</Text>
                  <Text style={styles.instructionItem}>• You'll receive rewards for the time spent in detox until the session ends</Text>
                </View>
              </View>

              {isActive && (
                <TouchableOpacity style={styles.endButton} onPress={handleEndDetox}>
                  <Text style={styles.endButtonText}>End Detox</Text>
                </TouchableOpacity>
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
                // Allow touch events to pass through when not dark
                pointerEvents: isScreenDark ? 'auto' : 'none'
              }
            ]}
          >
            <View style={styles.fullScreen} />
          </Animated.View>
        </TouchableWithoutFeedback>

        <DurationModal />
        <InstructionsModal />
        <StatsModal 
          visible={showStatsModal}
          onClose={() => setShowStatsModal(false)}
          stats={userStats}
        />
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
  endButton: {
    backgroundColor: '#FF4444',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.round,
    alignItems: 'center',
    marginTop: spacing.xl,
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
  statsModalContent: {
    padding: spacing.lg,
  },
  statsHeader: {
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
    marginBottom: spacing.xl,
    marginTop: spacing.lg,
  },
  closeButton: {
    position: 'absolute',
    right: -spacing.md,
    top: -spacing.xl,
    padding: spacing.sm,
    zIndex: 1,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '600',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  statIcon: {
    width: 24,
    height: 24,
  },
  statInfo: {
    flex: 1,
  },
  statLabel: {
    ...typography.body,
    color: '#E0E0E0',
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  statValue: {
    ...typography.h3,
    color: '#FFFFFF',
    fontWeight: '600',
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
});

export default DetoxScreen; 