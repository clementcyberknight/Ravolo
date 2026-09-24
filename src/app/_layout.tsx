import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import * as NavigationBar from "expo-navigation-bar";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { Platform, useColorScheme } from "react-native";

import { OnboardingScreen } from "@/components/onboarding-screen";
import { sessionManager } from "@/services/session-manager";
import { useAppStore } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";
import { startNetworkMonitoring } from "@/store/network-store";

// Keep the native splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isHydrated = useAppStore((state) => state._hasHydrated);
  const hasCompletedOnboarding = useAppStore(
    (state) => state.hasCompletedOnboarding,
  );
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

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

  // ── Network monitoring (runs for the entire app lifetime) ──
  useEffect(() => {
    const teardown = startNetworkMonitoring();
    return teardown;
  }, []);

  // ── Session manager: start on auth, stop on logout ──
  useEffect(() => {
    if (isAuthenticated) {
      sessionManager.start();
    } else {
      sessionManager.stop();
    }
    return () => sessionManager.stop();
  }, [isAuthenticated]);

  if (!isHydrated) {
    return null;
  }

  if (!hasCompletedOnboarding || !isAuthenticated) {
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
