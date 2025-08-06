import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import { AuthStackParamList } from '../types/navigation';

const Stack = createStackNavigator<AuthStackParamList>();

interface AuthNavigatorProps {
  onAuthSuccess: () => void;
  showOnboarding?: boolean;
}

const AuthNavigator: React.FC<AuthNavigatorProps> = ({ onAuthSuccess, showOnboarding = false }) => {
  return (
    <Stack.Navigator 
      screenOptions={{ headerShown: false }}
      initialRouteName={showOnboarding ? "Onboarding" : "Login"}
    >
      <Stack.Screen 
        name="Onboarding" 
        component={OnboardingScreen}
      />
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        initialParams={{ onAuthSuccess }}
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen}
        initialParams={{ onAuthSuccess }}
      />
      <Stack.Screen 
        name="ForgotPassword" 
        component={ForgotPasswordScreen}
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator; 