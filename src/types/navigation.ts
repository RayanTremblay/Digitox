import { NavigatorScreenParams } from '@react-navigation/native';

// Main Tab Navigator Types
export type MainTabParamList = {
  Home: undefined;
  Market: undefined;
  Rewards: undefined;
  Profile: undefined;
};

// Root Stack Navigator Types (contains tabs and modal screens)
export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  Detox: undefined;
  Privacy: undefined;
  HelpSupport: undefined;
  AdminCode: undefined;
  Achievements: undefined;
};

// Auth Navigator Types
export type AuthStackParamList = {
  Onboarding: { onComplete: () => void };
  Login: { onAuthSuccess: () => void };
  Register: { onAuthSuccess: () => void };
  ForgotPassword: undefined;
}; 