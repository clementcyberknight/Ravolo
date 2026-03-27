import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import * as NavigationBar from "expo-navigation-bar";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { Platform, useColorScheme } from "react-native";

import { OnboardingScreen } from "@/components/onboarding-screen";
import { useAppStore } from "@/store/app-store";

// Keep the native splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isHydrated = useAppStore((state) => state._hasHydrated);
  const hasCompletedOnboarding = useAppStore(
    (state) => state.hasCompletedOnboarding,
  );

  useEffect(() => {
    if (isHydrated) {
      SplashScreen.hideAsync();
    }
  }, [isHydrated]);

  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setVisibilityAsync("hidden");
      NavigationBar.setBehaviorAsync("overlay-swipe");
    }
  }, []);

  if (!isHydrated) {
    return null;
  }

  if (!hasCompletedOnboarding) {
    return (
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <StatusBar hidden />
        <OnboardingScreen />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <StatusBar hidden />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen 
          name="syndicate-chat" 
          options={{
            presentation: "card",
            animation: "slide_from_bottom",
          }} 
        />
      </Stack>
    </ThemeProvider>
  );
}
