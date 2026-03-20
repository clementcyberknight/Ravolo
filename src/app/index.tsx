import { Image } from "expo-image";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FarmGrid } from "@/components/farm-grid";
import { RanchGrid } from "@/components/ranch-grid";
import { HomeSubTabs, HomeTabType } from "@/components/home-sub-tabs";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BottomTabInset } from "@/constants/theme";
import { useInventoryStore } from "@/stores/inventory-store";

const inventoryIcon = require("@/assets/image/assets_images_icons_misc_box.webp");
const marketIcon = require("@/assets/image/assets_images_icons_misc_market.webp");

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState<HomeTabType>("farm");

  // Sum total items in inventory for the badge
  const totalItems = useInventoryStore((state) =>
    Object.values(state.items).reduce((acc, item) => acc + item.quantity, 0)
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Actions Row: Bonus + Boost (Mocking the UI from the screenshot) */}
          <View style={styles.topActionsRow}>
            <View style={[styles.actionBadge, styles.bonusBadge]}>
              <ThemedText style={styles.actionTextBonus}>Bonus +15%</ThemedText>
            </View>
            <View style={styles.actionBadge}>
              <ThemedText style={styles.actionText}>Boost</ThemedText>
            </View>
          </View>

          {/* Sub Navigation Tabs */}
          <HomeSubTabs activeTab={activeTab} onChangeTab={setActiveTab} />

          {/* Tab Content */}
          {activeTab === "farm" && <FarmGrid />}
          {activeTab === "ranch" && <RanchGrid />}
          {activeTab === "craft" && (
            <View style={styles.comingSoon}>
              <ThemedText>Crafting coming soon...</ThemedText>
            </View>
          )}
          {activeTab === "upgrade" && (
            <View style={styles.comingSoon}>
              <ThemedText>Upgrades coming soon...</ThemedText>
            </View>
          )}
        </ScrollView>

        {/* Floating Action Buttons */}
        <View style={styles.leftFabContainer}>
          <Pressable style={styles.fab}>
            <Image source={marketIcon} style={styles.fabImage} contentFit="contain" />
            <View style={styles.badgeRed}>
              <ThemedText style={styles.badgeTextLight}>1</ThemedText>
            </View>
          </Pressable>
        </View>

        <View style={styles.rightFabContainer}>
          <Pressable style={styles.fab}>
            <Image source={inventoryIcon} style={styles.fabImage} contentFit="contain" />
            <View style={styles.badgeGray}>
              <ThemedText style={styles.badgeTextDark}>{totalItems}</ThemedText>
            </View>
          </Pressable>
        </View>

      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: BottomTabInset + 20,
  },
  topActionsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 8,
  },
  actionBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#EFEFEF",
    gap: 6,
  },
  bonusBadge: {
    backgroundColor: "#F3E5F5",
    borderColor: "#E1BEE7",
  },
  actionText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#555",
  },
  actionTextBonus: {
    fontSize: 14,
    fontWeight: "700",
    color: "#8E24AA",
  },
  comingSoon: {
    padding: 32,
    alignItems: "center",
  },
  leftFabContainer: {
    position: "absolute",
    bottom: BottomTabInset + 16,
    left: 16,
    zIndex: 10,
  },
  rightFabContainer: {
    position: "absolute",
    bottom: BottomTabInset + 16,
    right: 16,
    zIndex: 10,
  },
  fab: {
    width: 60,
    height: 60,
    position: "relative",
  },
  fabImage: {
    width: "100%",
    height: "100%",
  },
  badgeRed: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#F44336",
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  badgeGray: {
    position: "absolute",
    bottom: -5,
    right: -5,
    backgroundColor: "#DFD8CF",
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  badgeTextLight: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "800",
  },
  badgeTextDark: {
    color: "#333",
    fontSize: 11,
    fontWeight: "800",
  },
});
