import React, { memo } from "react";
import { Pressable, StyleSheet, Text, ScrollView, ViewStyle } from "react-native";
import { Image } from "expo-image";
import { Fonts } from "@/constants/theme";

interface TabItem {
  id: string;
  label?: string;
  icon?: any;
}

interface SubTabsProps {
  tabs: TabItem[];
  activeTabId: string;
  onTabPress: (id: string) => void;
  style?: ViewStyle;
}

const D = "#032018"; // Dark Green
const W = "#FFFFFF"; // White
const GREEN = "#81C784"; // Active Green from index reference

export const SubTabs = memo(function SubTabs({
  tabs,
  activeTabId,
  onTabPress,
  style,
}: SubTabsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.container, style]}
      contentContainerStyle={styles.contentContainer}
    >
      {tabs.map((tab) => {
        const isActive = activeTabId === tab.id;
        return (
          <Pressable
            key={tab.id}
            style={[styles.tabItem, isActive && styles.activeTab]}
            onPress={() => onTabPress(tab.id)}
          >
            {tab.icon && (
              <Image
                source={tab.icon}
                style={[styles.icon, isActive && styles.activeIcon]}
                contentFit="contain"
              />
            )}
            {tab.label && (
              <Text 
                style={[styles.label, isActive && styles.activeLabel]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    maxHeight: 72, // Keep it compact
  },
  contentContainer: {
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tabItem: {
    flexGrow: 1,
    flexShrink: 0,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#EFEFEF",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 16,
  },
  activeTab: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },
  icon: {
    width: 24,
    height: 24,
    opacity: 0.6,
  },
  activeIcon: {
    opacity: 1,
    tintColor: W,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: D,
    opacity: 0.6,
    fontFamily: Fonts.mono,
  },
  activeLabel: {
    color: W,
    opacity: 1,
  },
});
