import React, { useEffect, useState } from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { SplashScreen } from './app/components/SplashScreen';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate some loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <SplashScreen />;
  }

  return <AppNavigator />;
}
