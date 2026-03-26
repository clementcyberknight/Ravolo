import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import React, { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import { Platform, useColorScheme, View } from 'react-native';

import AppTabs from '@/components/app-tabs';
import { ProfileHeader } from '@/components/profile-header';
import { OnboardingScreen } from '@/components/onboarding-screen';
import { useAppStore } from '@/store/app-store';

// Keep the native splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isHydrated = useAppStore((state) => state._hasHydrated);
  const hasCompletedOnboarding = useAppStore((state) => state.hasCompletedOnboarding);

  useEffect(() => {
    if (isHydrated) {
      // Hide the native splash screen ONLY after hydration
      SplashScreen.hideAsync();
    }
  }, [isHydrated]);

  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync('transparent');
      NavigationBar.setButtonStyleAsync('light');
      NavigationBar.setPositionAsync('absolute');
    }
  }, []);

  if (!isHydrated) {
    return null; // Keep splash screen visible while waiting for hydration
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar hidden />
      {!hasCompletedOnboarding ? (
        <OnboardingScreen />
      ) : (
        <View style={{ flex: 1 }}>
          <ProfileHeader />
          <AppTabs />
        </View>
      )}
    </ThemeProvider>
  );
}
