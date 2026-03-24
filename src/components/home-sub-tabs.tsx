import { Image } from "expo-image";
import React, { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

const farmIcon = require("@/assets/inapp-icons/home-tab-icons/Vegetable-Rosemary--Streamline-Ultimate.png");
const ranchIcon = require("@/assets/inapp-icons/home-tab-icons/Range-Cow-1--Streamline-Ultimate.png");
const craftIcon = require("@/assets/inapp-icons/home-tab-icons/Making-Slime-1--Streamline-Ultimate.png");
const upgradeIcon = require("@/assets/inapp-icons/home-tab-icons/Stat-2--Streamline-Rounded-Streamline-Material.png");

export type HomeTabType = "farm" | "ranch" | "craft" | "upgrade";

interface TabConfig {
  id: HomeTabType;
  icon: any;
}

const TABS: TabConfig[] = [
  { id: "farm", icon: farmIcon },
  { id: "ranch", icon: ranchIcon },
  { id: "craft", icon: craftIcon },
];

interface HomeSubTabsProps {
  activeTab: HomeTabType;
  onChangeTab: (tab: HomeTabType) => void;
}

export const HomeSubTabs = memo(function HomeSubTabs({
  activeTab,
  onChangeTab,
}: HomeSubTabsProps) {
  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <Pressable
            key={tab.id}
            style={[styles.tabItem, isActive && styles.activeTab]}
            onPress={() => onChangeTab(tab.id)}
          >
            <Image
              source={tab.icon}
              style={[styles.icon, isActive && styles.activeIcon]}
              contentFit="contain"
            />
          </Pressable>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tabItem: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#EFEFEF",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  activeTab: {
    backgroundColor: "#81C784", // Green background
    borderColor: "#81C784",
  },
  icon: {
    width: 24,
    height: 24,
    opacity: 0.6, // Dimmed when inactive
  },
  activeIcon: {
    opacity: 1,
    tintColor: "#fff", // Or leave original color if it works better without tint
  },
});
