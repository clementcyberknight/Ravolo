import { Tabs } from "expo-router";
import React from "react";
import { View, StyleSheet, useColorScheme } from "react-native";
import { ProfileHeader } from "@/components/profile-header";
import { Colors } from "@/constants/theme";
import { Image } from "expo-image";

export default function TabsLayout() {
  const scheme = useColorScheme() ?? "light";
  const colors = Colors[scheme];

  return (
    <View style={{ flex: 1 }}>
      <ProfileHeader />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.text,
          tabBarInactiveTintColor: colors.text + "80", // Opacity 0.5
          tabBarStyle: {
            backgroundColor: colors.background,
            borderTopWidth: 0,
            elevation: 0,
            height: 60,
            paddingBottom: 10,
          },
          tabBarLabelStyle: {
            fontFamily: "Space Mono",
            fontSize: 10,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, focused }) => (
              <Image 
                source={require("@/assets/inapp-icons/Farm-Light--Streamline-Phosphor.png")} 
                style={[styles.icon, { tintColor: color }]} 
              />
            ),
          }}
        />
        <Tabs.Screen
          name="syndicate"
          options={{
            title: "Syndicate",
            tabBarIcon: ({ color, focused }) => (
              <Image 
                source={require("@/assets/inapp-icons/Team-Share-Idea--Streamline-Ultimate.png")} 
                style={[styles.icon, { tintColor: color }]} 
              />
            ),
          }}
        />
        <Tabs.Screen
          name="leaderboard"
          options={{
            title: "Leaderboard",
            tabBarIcon: ({ color, focused }) => (
              <Image 
                source={require("@/assets/inapp-icons/Fantasy-Medieval-Roleplay-Game-Party-Leader--Streamline-Ultimate.png")} 
                style={[styles.icon, { tintColor: color }]} 
              />
            ),
          }}
        />
        <Tabs.Screen
          name="shop"
          options={{
            title: "Shop",
            tabBarIcon: ({ color, focused }) => (
              <Image 
                source={require("@/assets/inapp-icons/Shop-Star-Rating--Streamline-Ultimate.png")} 
                style={[styles.icon, { tintColor: color }]} 
              />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  icon: {
    width: 24,
    height: 24,
  },
});
