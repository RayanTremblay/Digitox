import React from 'react';
import { StatusBar } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { colors } from './src/theme/theme';
import { useFonts } from 'expo-font';
import {
  Maitree_400Regular,
  Maitree_600SemiBold,
  Maitree_700Bold,
} from '@expo-google-fonts/maitree';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    Maitree_400Regular,
    Maitree_600SemiBold,
    Maitree_700Bold,
  });

  React.useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.background}
        translucent
      />
      <AppNavigator />
    </>
  );
}
