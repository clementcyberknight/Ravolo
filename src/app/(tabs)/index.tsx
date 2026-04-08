import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CraftingGrid } from "@/components/crafting-grid";
import { FarmGrid } from "@/components/farm-grid";
import { InventoryModal } from "@/components/inventory-modal";
import { MarketModal } from "@/components/market-modal";
import { RanchGrid } from "@/components/ranch-grid";
import { SeedSelectorModal } from "@/components/seed-selector-modal";
import { SubTabs } from "@/components/sub-tabs";
import { ThemedView } from "@/components/themed-view";
import { BottomTabInset } from "@/constants/theme";
import { websocketManager } from "@/services/websocket-manager";
import { useAuthStore } from "@/store/auth-store";
import { useFarmStore } from "@/store/farm-store";
import { useInventoryStore } from "@/store/inventory-store";
import { useNetworkStore } from "@/store/network-store";

const inventoryIcon = require("@/assets/image/assets_images_icons_misc_box.webp");
const marketIcon = require("@/assets/image/assets_images_icons_misc_market.webp");
const seedIcon = require("@/assets/image/assets_images_icons_misc_emoji_wheat.webp");

const seedlingAssets: Record<string, any> = {
  cacao: require("@/assets/seedlings/cacao_seedling.png"),
  carrot: require("@/assets/seedlings/carrot_seedling.png"),
  chili: require("@/assets/seedlings/chile_seedling.png"),
  coffee_beans: require("@/assets/seedlings/coffee_beans.png"),
  corn: require("@/assets/seedlings/corn_seedling.png"),
  cotton: require("@/assets/seedlings/cotton_seedling.png"),
  grapes: require("@/assets/seedlings/grape_seedling.png"),
  lavender: require("@/assets/seedlings/lavender_seedling.png"),
  mud_pit: require("@/assets/seedlings/mud_pit.png"),
  oat: require("@/assets/seedlings/oat_seedling.png"),
  onion: require("@/assets/seedlings/onion_seedling.png"),
  pepper: require("@/assets/seedlings/pepper_seedling.png"),
  potato: require("@/assets/seedlings/potato_seedling.png"),
  rice: require("@/assets/seedlings/rice_seedling.png"),
  saffron: require("@/assets/seedlings/saffron_seedling.png"),
  sapling_patch: require("@/assets/seedlings/sapling_patch.png"),
  soybean: require("@/assets/seedlings/soyabeans_seedling.png"),
  strawberry: require("@/assets/seedlings/strawberry_seedling.png"),
  sugarcane: require("@/assets/seedlings/sugarcane_seedling.png"),
  sunflower: require("@/assets/seedlings/sunflower_seedling.png"),
  tea_leaves: require("@/assets/seedlings/tea_leaves.png"),
  tomato: require("@/assets/seedlings/tomatoes_seedling.png"),
  vanilla: require("@/assets/seedlings/vanilla_seedling.png"),
  wheat: require("@/assets/seedlings/wheat_seedling.png"),
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

function toBackendSeedInventoryKey(cropId: string): string {
  switch (cropId) {
    case "coffee_beans":
      return "seed:coffee";
    case "tea_leaves":
      return "seed:tea";
    case "sapling_patch":
      return "seed:sapling";
    default:
      return `seed:${cropId}`;
  }
}

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState<HomeTabType>("farm");
  const [inventoryVisible, setInventoryVisible] = useState(false);
  const [marketVisible, setMarketVisible] = useState(false);
  const [seedSelectorVisible, setSeedSelectorVisible] = useState(false);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const getValidAccessToken = useAuthStore(
    (state) => state.getValidAccessToken,
  );

  const selectedCropId = useFarmStore((state) => state.selectedCropId);

  const totalItems = useInventoryStore((state) =>
    Object.values(state.items).reduce((acc, item) => acc + item.quantity, 0),
  );
  const selectedCropQuantity = useInventoryStore(
    (state) =>
      state.items[toBackendSeedInventoryKey(selectedCropId)]?.quantity || 0,
  );

  const isOnline = useNetworkStore((s) => s.isOnline);

  useEffect(() => {
    let mounted = true;
    const ensureSocket = async () => {
      if (!isAuthenticated) return;
      if (websocketManager.isConnected()) return;

      if (!isOnline) {
        Alert.alert(
          "You're offline",
          "Connect to the internet to sync your farm and use the market.",
        );
        return;
      }

      const token = await getValidAccessToken();
      if (!mounted || !token) return;
      websocketManager.connect(token);
    };

    ensureSocket();
    return () => {
      mounted = false;
    };
  }, [getValidAccessToken, isAuthenticated, isOnline]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
        {/* ── TAB NAVIGATION ── */}
        <SubTabs
          tabs={HOME_TABS}
          activeTabId={activeTab}
          onTabPress={(id) => setActiveTab(id as HomeTabType)}
        />

        {/* ── MAIN SCROLL AREA ── */}
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === "farm" && <FarmGrid />}
          {activeTab === "ranch" && <RanchGrid />}
          {activeTab === "craft" && <CraftingGrid />}

          {/* Spacer clears FABs */}
          <View style={{ height: BottomTabInset + 120 }} />
        </ScrollView>

        {/* ── FAB: LEFT — Inventory ── */}
        <View style={styles.fabLeft}>
          <Pressable
            style={({ pressed }) => [
              styles.fab,
              styles.fabDark,
              pressed && styles.fabPressed,
            ]}
            onPress={() => setInventoryVisible(true)}
          >
            <Image
              source={inventoryIcon}
              style={styles.fabImage}
              contentFit="contain"
            />
            {totalItems > 0 && (
              <View style={styles.badgeGray}>
                <Text style={styles.badgeTextDark}>{totalItems}</Text>
              </View>
            )}
          </Pressable>
          <Text style={styles.fabLabel}>Inventory</Text>
        </View>

        {/* ── FABs: RIGHT — Seed + Market ── */}
        <View style={styles.fabRight}>
          {/* Seed Selector — primary action, larger */}
          <View style={styles.fabItem}>
            <Pressable
              style={({ pressed }) => [
                styles.fab,
                styles.fabGreen,
                styles.fabPrimary,
                pressed && styles.fabPressed,
              ]}
              onPress={() => setSeedSelectorVisible(true)}
            >
              <Image
                source={seedlingAssets[selectedCropId] || seedIcon}
                style={styles.fabImage}
                contentFit="contain"
              />
              <View
                style={[
                  styles.badgeRed,
                  selectedCropQuantity === 0 && styles.badgeGray,
                ]}
              >
                <Text
                  style={
                    selectedCropQuantity === 0
                      ? styles.badgeTextDark
                      : styles.badgeTextLight
                  }
                >
                  {selectedCropQuantity}
                </Text>
              </View>
            </Pressable>
            <Text
              style={[styles.fabLabel, { color: "#71B312", fontWeight: "700" }]}
            >
              Seeds
            </Text>
          </View>

          {/* Market */}
          <View style={styles.fabItem}>
            <Pressable
              style={({ pressed }) => [
                styles.fab,
                styles.fabDark,
                pressed && styles.fabPressed,
              ]}
              onPress={() => setMarketVisible(true)}
            >
              <Image
                source={marketIcon}
                style={styles.fabImage}
                contentFit="contain"
              />
            </Pressable>
            <Text style={styles.fabLabel}>Market</Text>
          </View>
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
    backgroundColor: "#F5F7F2",
  },
  safeArea: {
    flex: 1,
  },
  // ── SCROLL
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  // ── FABs
  fabLeft: {
    position: "absolute",
    bottom: 16,
    left: 16,
    alignItems: "center",
    gap: 5,
    zIndex: 10,
  },
  fabRight: {
    position: "absolute",
    bottom: 16,
    right: 16,
    alignItems: "center",
    gap: 10,
    zIndex: 10,
  },
  fabItem: {
    alignItems: "center",
    gap: 5,
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 18,
    padding: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  fabPrimary: {
    width: 64,
    height: 64,
    borderRadius: 20,
    padding: 14,
  },
  fabDark: {
    backgroundColor: "#032018",
  },
  fabGreen: {
    backgroundColor: "#71B312",
  },
  fabPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
  fabImage: {
    width: "100%",
    height: "100%",
  },
  fabLabel: {
    fontSize: 10,
    fontFamily: "Space Mono",
    color: "rgba(3,32,24,0.50)",
    fontWeight: "700",
  },

  // ── BADGES
  badgeRed: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#FF383C",
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#F5F7F2",
  },
  badgeGray: {
    position: "absolute",
    bottom: -6,
    right: -6,
    backgroundColor: "#E2DDD6",
    borderRadius: 11,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 3,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#F5F7F2",
  },
  badgeTextLight: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
    fontFamily: "Space Mono",
  },
  badgeTextDark: {
    color: "#032018",
    fontSize: 10,
    fontWeight: "800",
    fontFamily: "Space Mono",
  },
});
