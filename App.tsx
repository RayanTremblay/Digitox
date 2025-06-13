import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import { SplashScreen } from './app/components/SplashScreen';

const AppContent = () => {
  const { user, isLoading, isFirstLaunch, setIsFirstLaunch } = useAuth();

  if (isLoading) {
    return <SplashScreen />;
  }

  // Show auth navigator if user is not authenticated or it's first launch
  if (!user || isFirstLaunch) {
    return (
      <NavigationContainer>
        <AuthNavigator 
          onAuthSuccess={() => {
            setIsFirstLaunch(false);
          }} 
        />
      </NavigationContainer>
    );
  }

  return <AppNavigator />;
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
