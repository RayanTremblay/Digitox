import React from 'react';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import LoginScreen from './src/screens/LoginScreen';
import { SplashScreen } from './app/components/SplashScreen';

const AppContent = () => {
  const { user, isLoading, isFirstLaunch, setIsFirstLaunch } = useAuth();

  if (isLoading) {
    return <SplashScreen />;
  }

  // Show login screen if user is not authenticated or it's first launch
  if (!user || isFirstLaunch) {
    return (
      <LoginScreen 
        onAuthSuccess={() => {
          setIsFirstLaunch(false);
        }} 
      />
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
