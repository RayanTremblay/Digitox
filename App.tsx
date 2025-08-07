import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import { SplashScreen } from './app/components/SplashScreen';
import ErrorBoundary from './src/components/ErrorBoundary';
import mobileAds from 'react-native-google-mobile-ads';
import notificationService from './src/services/notificationService';
import achievementService from './src/services/achievementService';

const AppContent = () => {
  const { user, isLoading, isFirstLaunch, setIsFirstLaunch } = useAuth();

  if (isLoading) {
    return (
      <ErrorBoundary>
        <SplashScreen />
      </ErrorBoundary>
    );
  }

  // Show auth navigator if user is not authenticated or it's first launch
  if (!user || isFirstLaunch) {
    return (
      <ErrorBoundary>
        <NavigationContainer>
          <AuthNavigator 
            onAuthSuccess={() => {
              setIsFirstLaunch(false);
            }}
            showOnboarding={isFirstLaunch}
          />
        </NavigationContainer>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <AppNavigator />
    </ErrorBoundary>
  );
};

export default function App() {
  useEffect(() => {
    const initializeServices = async () => {
      // Initialize Google Mobile Ads SDK
      try {
        const adapterStatuses = await mobileAds().initialize();
        console.log('Google Mobile Ads SDK initialized successfully');
        console.log('Adapter statuses:', adapterStatuses);
      } catch (error) {
        console.error('Google Mobile Ads SDK initialization failed:', error);
      }

      // Initialize notification service
      try {
        const notificationInitialized = await notificationService.initialize();
        if (notificationInitialized) {
          console.log('Notification service initialized successfully');
        } else {
          console.log('Notification service initialization skipped or failed');
        }
      } catch (error) {
        console.error('Notification service initialization failed:', error);
      }

      // Initialize achievement service
      try {
        await achievementService.initialize();
        console.log('Achievement service initialized successfully');
      } catch (error) {
        console.error('Achievement service initialization failed:', error);
      }
    };

    initializeServices();
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}
