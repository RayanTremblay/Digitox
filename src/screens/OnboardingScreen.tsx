import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { colors, typography, spacing, borderRadius } from '../theme/theme';
import { AuthStackParamList } from '../types/navigation';

type OnboardingNavigationProp = StackNavigationProp<AuthStackParamList, 'Onboarding'>;

interface OnboardingScreenProps {
  onComplete?: () => void;
}

interface OnboardingSlide {
  id: number;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const slides: OnboardingSlide[] = [
  {
    id: 1,
    title: 'Welcome to Digitox',
    description: 'Take control of your digital wellness and earn rewards for spending time away from your phone.',
    icon: 'phone-portrait',
    color: '#6C63FF',
  },
  {
    id: 2,
    title: 'Earn Digicoins',
    description: 'Complete detox sessions and daily challenges to earn Digicoins that you can spend in our marketplace.',
    icon: 'logo-bitcoin',
    color: '#4CAF50',
  },
  {
    id: 3,
    title: 'Redeem Rewards',
    description: 'Exchange your Digicoins for real rewards like Amazon gift cards, gadgets, and wellness products.',
    icon: 'gift',
    color: '#FF6B6B',
  },
  {
    id: 4,
    title: 'Track Progress',
    description: 'Monitor your digital wellness journey with detailed stats, streaks, and achievements.',
    icon: 'stats-chart',
    color: '#FF9500',
  },
];

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const navigation = useNavigation<OnboardingNavigationProp>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const { width } = Dimensions.get('window');

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        const newSlide = currentSlide + 1;
        setCurrentSlide(newSlide);
        scrollViewRef.current?.scrollTo({
          x: newSlide * width,
          animated: true,
        });
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    } else {
      if (onComplete) {
        onComplete();
      } else {
        navigation.navigate('Login');
      }
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        const newSlide = currentSlide - 1;
        setCurrentSlide(newSlide);
        scrollViewRef.current?.scrollTo({
          x: newSlide * width,
          animated: true,
        });
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  const skip = () => {
    if (onComplete) {
      onComplete();
    } else {
      navigation.navigate('Login');
    }
  };

  const renderSlide = (slide: OnboardingSlide, index: number) => (
    <View key={slide.id} style={[styles.slide, { width }]}>
      <Animated.View style={[styles.slideContent, { opacity: fadeAnim }]}>
        <View style={[styles.iconContainer, { backgroundColor: slide.color }]}>
          <Ionicons name={slide.icon} size={60} color="#FFFFFF" />
        </View>
        
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.description}>{slide.description}</Text>
      </Animated.View>
    </View>
  );

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {slides.map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            {
              backgroundColor: index === currentSlide ? colors.primary : colors.textSecondary,
              width: index === currentSlide ? 30 : 8,
            },
          ]}
        />
      ))}
    </View>
  );

  return (
    <LinearGradient colors={['#1D2024', '#6E7A8A']} style={styles.container}>
      <TouchableOpacity style={styles.skipButton} onPress={skip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        style={styles.scrollView}
      >
        {slides.map(renderSlide)}
      </ScrollView>

      {renderDots()}

      <View style={styles.buttonContainer}>
        {currentSlide > 0 && (
          <TouchableOpacity style={styles.backButton} onPress={prevSlide}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}

        <View style={styles.spacer} />

        <TouchableOpacity style={styles.nextButton} onPress={nextSlide}>
          <Text style={styles.nextButtonText}>
            {currentSlide === slides.length - 1 ? "Get Started" : "Next"}
          </Text>
          <Ionicons 
            name={currentSlide === slides.length - 1 ? "checkmark" : "chevron-forward"} 
            size={24} 
            color="#FFFFFF" 
          />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  skipText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  slideContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 16,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    transition: 'all 0.3s ease',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl + 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  backButtonText: {
    ...typography.body,
    color: colors.text,
    marginLeft: spacing.xs,
  },
  spacer: {
    flex: 1,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.round,
    minWidth: 120,
    justifyContent: 'center',
  },
  nextButtonText: {
    ...typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
    marginRight: spacing.xs,
  },
});

export default OnboardingScreen;