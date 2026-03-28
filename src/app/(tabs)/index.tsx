import { Image } from "expo-image";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CraftingGrid } from "@/components/crafting-grid";
import { FarmGrid } from "@/components/farm-grid";
import { SubTabs } from "@/components/sub-tabs";
import { InventoryModal } from "@/components/inventory-modal";
import { MarketModal } from "@/components/market-modal";
import { RanchGrid } from "@/components/ranch-grid";
import { SeedSelectorModal } from "@/components/seed-selector-modal";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BottomTabInset } from "@/constants/theme";
import { useFarmStore } from "@/store/farm-store";
import { useInventoryStore } from "@/store/inventory-store";

const inventoryIcon = require("@/assets/image/assets_images_icons_misc_box.webp");
const marketIcon = require("@/assets/image/assets_images_icons_misc_market.webp");
const seedIcon = require("@/assets/image/assets_images_icons_misc_emoji_wheat.webp");

const cropAssets: Record<string, any> = {
  wheat: require("@/assets/image/assets_images_icons_crops_wheat.webp"),
  corn: require("@/assets/image/assets_images_icons_crops_corn.webp"),
  carrot: require("@/assets/image/assets_images_icons_crops_carrot.webp"),
};

const farmIcon = require("@/assets/inapp-icons/home-tab-icons/Vegetable-Rosemary--Streamline-Ultimate.png");
const ranchIcon = require("@/assets/inapp-icons/home-tab-icons/Range-Cow-1--Streamline-Ultimate.png");
const craftIcon = require("@/assets/inapp-icons/home-tab-icons/Making-Slime-1--Streamline-Ultimate.png");

type HomeTabType = "farm" | "ranch" | "craft";

const HOME_TABS = [
  { id: "farm", icon: farmIcon },
  { id: "ranch", icon: ranchIcon },
  { id: "craft", icon: craftIcon },
];

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState<HomeTabType>("farm");
  const [inventoryVisible, setInventoryVisible] = useState(false);
  const [marketVisible, setMarketVisible] = useState(false);
  const [seedSelectorVisible, setSeedSelectorVisible] = useState(false);

  const selectedCropId = useFarmStore((state) => state.selectedCropId);

  // Sum total items in inventory for the badge
  const totalItems = useInventoryStore((state) =>
    Object.values(state.items).reduce((acc, item) => acc + item.quantity, 0),
  );
  const selectedCropQuantity = useInventoryStore(
    (state) => state.items[selectedCropId]?.quantity || 0,
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Sub Navigation Tabs */}
          <SubTabs
            tabs={HOME_TABS}
            activeTabId={activeTab}
            onTabPress={(id) => setActiveTab(id as HomeTabType)}
          />

          {/* Tab Content */}
          {activeTab === "farm" && <FarmGrid />}
          {activeTab === "ranch" && <RanchGrid />}
          {activeTab === "craft" && <CraftingGrid />}
        </ScrollView>

        {/* Floating Action Buttons */}
        <View style={styles.floatingActionsLeft}>
          <Pressable
            style={[styles.fab, styles.fabDark]}
            onPress={() => setInventoryVisible(true)}
          >
            <Image
              source={inventoryIcon}
              style={styles.fabImage}
              contentFit="contain"
            />
            <View style={styles.badgeGray}>
              <ThemedText style={styles.badgeTextDark}>{totalItems}</ThemedText>
            </View>
          </Pressable>
        </View>

        <View style={styles.floatingActionsRight}>
          <Pressable
            style={[styles.fab, styles.fabGreen]}
            onPress={() => setSeedSelectorVisible(true)}
          >
            <Image
              source={cropAssets[selectedCropId] || seedIcon}
              style={styles.fabImage}
              contentFit="contain"
            />
            <View
              style={[
                styles.badgeRed,
                selectedCropQuantity === 0 ? styles.badgeGray : null,
              ]}
            >
              <ThemedText style={styles.badgeTextLight}>
                {selectedCropQuantity}
              </ThemedText>
            </View>
          </Pressable>

          <Pressable
            style={[styles.fab, styles.fabDark]}
            onPress={() => setMarketVisible(true)}
          >
            <Image
              source={marketIcon}
              style={styles.fabImage}
              contentFit="contain"
            />
          </Pressable>
        </View>
      </SafeAreaView>

      <InventoryModal
        visible={inventoryVisible}
        onClose={() => setInventoryVisible(false)}
      />

      <MarketModal
        visible={marketVisible}
        onClose={() => setMarketVisible(false)}
      />

      <SeedSelectorModal
        visible={seedSelectorVisible}
        onClose={() => setSeedSelectorVisible(false)}
      />
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
    paddingBottom: BottomTabInset,
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
  floatingActionsRight: {
    position: "absolute",
    bottom: 20,
    right: 16,
    zIndex: 10,
    gap: 12,
    alignItems: "flex-end",
  },
  floatingActionsLeft: {
    position: "absolute",
    bottom: 20,
    left: 16,
    zIndex: 10,
    alignItems: "flex-start",
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 20,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  fabDark: {
    backgroundColor: "#032018",
  },
  fabGreen: {
    backgroundColor: "#71B312",
  },
  fabImage: {
    width: "100%",
    height: "100%",
  },
  badgeRed: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#F44336",
    borderRadius: 14,
    minWidth: 24,
    height: 24,
    paddingHorizontal: 4,
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
    fontSize: 11,
    fontWeight: "900",
  },
  badgeTextDark: {
    color: "#333",
    fontSize: 11,
    fontWeight: "800",
  },
});
