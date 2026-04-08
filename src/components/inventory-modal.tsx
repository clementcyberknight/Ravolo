import { useInventoryStore } from "@/store/inventory-store";
import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import React, { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const ASSET_MAP: Record<string, any> = {
  // Crops
  wheat: require("@/assets/image/assets_images_icons_crops_wheat.webp"),
  corn: require("@/assets/image/assets_images_icons_crops_corn.webp"),
  carrot: require("@/assets/image/assets_images_icons_crops_carrot.webp"),
  chili: require("@/assets/image/assets_images_icons_crops_chili.webp"),
  coffee_beans: require("@/assets/image/assets_images_icons_crops_coffee_beans.webp"),
  potato: require("@/assets/image/assets_images_icons_crops_potato.webp"),
  rice: require("@/assets/image/assets_images_icons_crops_rice.webp"),
  saffron: require("@/assets/image/assets_images_icons_crops_saffron.webp"),
  strawberry: require("@/assets/image/assets_images_icons_crops_strawberry.webp"),
  tomato: require("@/assets/image/assets_images_icons_crops_tomato.webp"),
  sugarcane: require("@/assets/image/assets_images_icons_crops_sugarcane.webp"),
  cotton: require("@/assets/image/assets_images_icons_crops_cotton.webp"),
  lavender: require("@/assets/image/assets_images_icons_crops_lavender.webp"),
  oat: require("@/assets/image/assets_images_icons_crops_oat.webp"),
  soybean: require("@/assets/image/assets_images_icons_crops_soybean.webp"),
  onion: require("@/assets/image/assets_images_icons_crops_onion.webp"),
  pepper: require("@/assets/image/assets_images_icons_crops_pepper.webp"),
  tea_leaves: require("@/assets/image/assets_images_icons_crops_tea_leaves.webp"),
  sunflower: require("@/assets/image/assets_images_icons_crops_sunflower.webp"),

  // Products
  egg: require("@/assets/image/assets_images_icons_animalproducts_egg.webp"),
  milk: require("@/assets/image/assets_images_icons_animalproducts_milk.webp"),
  goat_milk: require("@/assets/image/assets_images_icons_animalproducts_goat_milk.webp"),
  pork: require("@/assets/image/assets_images_icons_animalproducts_pork.webp"),
  wool: require("@/assets/image/assets_images_icons_animalproducts_wool.webp"),
  silk: require("@/assets/image/assets_images_icons_animalproducts_silk_thread.webp"),
  honey: require("@/assets/image/assets_images_icons_animalproducts_honey.webp"),

  // Crafted Products
  flour: require("@/assets/image/assets_images_icons_crafts_flour.webp"),
  cornmeal: require("@/assets/image/assets_images_icons_crafts_cornmeal.webp"),
  corn_syrup: require("@/assets/image/assets_images_icons_crafts_corn_syrup.webp"),
  rice_flour: require("@/assets/image/assets_images_icons_crafts_rice_flour.webp"),
  cornbread: require("@/assets/image/assets_images_icons_crafts_cornbread.webp"),
  bread: require("@/assets/image/assets_images_icons_crafts_bread.webp"),
  muffin: require("@/assets/image/assets_images_icons_crafts_corn_muffins.webp"),
  sugar: require("@/assets/image/assets_images_icons_crafts_sugar.webp"),
  vanilla_pods: require("@/assets/image/assets_images_icons_crops_vanilla.webp"),
};

function formatItemName(id: string) {
  return id
    .replace(/^seed:/, "")
    .replace(/^animal:/, "")
    .replace(/^tool:/, "")
    .replace(/^craft:/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

const boxIcon = require("@/assets/image/assets_images_icons_misc_box.webp");
const boostIcon = require("@/assets/image/assets_images_icons_misc_boosts.webp");
const filterIcon = require("@/assets/inapp-icons/Filter--Streamline-Bootstrap.svg");
const closeIconSvg = require("@/assets/inapp-icons/x-close.svg");

interface InventoryModalProps {
  visible: boolean;
  onClose: () => void;
}

export const InventoryModal = ({ visible, onClose }: InventoryModalProps) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<"items" | "boosts">("items");
  const [searchQuery, setSearchQuery] = useState("");

  const items = useInventoryStore((state) => state.items);
  const totalItems = useMemo(
    () => Object.values(items).reduce((acc, item) => acc + item.quantity, 0),
    [items],
  );
  const maxCapacity = 120; // Hardcoded capacity based on mockup

  const filteredItems = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return Object.values(items)
      .filter((item) => item.quantity > 0)
      .filter((item) => {
        if (!normalizedQuery) {
          return true;
        }

        return `${item.id} ${formatItemName(item.id)}`
          .toLowerCase()
          .includes(normalizedQuery);
      })
      .sort((a, b) => b.quantity - a.quantity || a.id.localeCompare(b.id));
  }, [items, searchQuery]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={[styles.container, { paddingTop: Math.max(insets.top, 20) + 8 }]}>
        {/* Top Segmented Control (Items / Boosts) */}
        <View style={styles.topTabsContainer}>
          <Pressable
            style={[
              styles.topTab,
              activeTab === "items" && styles.topTabActive,
            ]}
            onPress={() => setActiveTab("items")}
          >
            <Image
              source={boxIcon}
              style={styles.tabIcon}
              contentFit="contain"
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "items" && styles.tabTextActive,
              ]}
            >
              Items
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.topTab,
              activeTab === "boosts" && styles.topTabActive,
            ]}
            onPress={() => setActiveTab("boosts")}
          >
            <Image
              source={boostIcon}
              style={styles.tabIcon}
              contentFit="contain"
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "boosts" && styles.tabTextActive,
              ]}
            >
              Boosts
            </Text>
          </Pressable>
        </View>

        {/* Content Body */}
        <View style={styles.contentBody}>
          {/* Header Row */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerTitle}>Inventory</Text>
              <Text style={styles.headerSubtitle}>
                Sell excess items for coins
              </Text>
            </View>
            <View style={styles.capacityContainer}>
              <Image
                source={boxIcon}
                style={styles.capacityIcon}
                contentFit="contain"
              />
              <Text style={styles.capacityText}>
                {totalItems}/{maxCapacity}
              </Text>
            </View>
          </View>

          {/* Search Row */}
          <View style={styles.searchRow}>
            <View style={styles.searchBar}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search items..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <Pressable style={styles.filterButton}>
              <Image source={filterIcon} style={styles.filterSvg} />
            </Pressable>
          </View>

          {/* Grid View */}
          <View style={styles.gridWrapper}>
            {activeTab === "items" ? (
              <FlashList
                data={filteredItems}
                keyExtractor={(item) => item.id}
                numColumns={4}
                contentContainerStyle={styles.gridContent}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  const asset = ASSET_MAP[item.id] || boxIcon;
                  return (
                    <View style={styles.itemCard}>
                      <Image
                        source={asset}
                        style={styles.itemImage}
                        contentFit="contain"
                      />
                      <Text style={styles.itemName} numberOfLines={2}>
                        {formatItemName(item.id)}
                      </Text>
                      <Text style={styles.itemCount}>x{item.quantity}</Text>
                    </View>
                  );
                }}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>No matching items found.</Text>
                  </View>
                }
              />
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No boosts available.</Text>
              </View>
            )}
          </View>
        </View>

        {/* Floating Close Button at Bottom */}
        <View
          style={[styles.closeContainer, { paddingBottom: insets.bottom + 20 }]}
        >
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Image
              source={closeIconSvg}
              style={styles.closeSvg}
              contentFit="contain"
            />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  topTabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    justifyContent: "center",
  },
  topTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "#F2F2F2",
    gap: 8,
  },
  topTabActive: {
    backgroundColor: "#7BC47F", // Vibrant green from mockup
  },
  tabIcon: {
    width: 24,
    height: 24,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#777",
  },
  tabTextActive: {
    color: "#FFF",
  },
  contentBody: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#1A1A1A",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#777",
    marginTop: 4,
  },
  capacityContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  capacityIcon: {
    width: 20,
    height: 20,
  },
  capacityText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1A1A1A",
  },
  searchRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
    opacity: 0.5,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  filterSvg: {
    width: 24,
    height: 24,
    tintColor: "#555",
  },
  gridContent: {
    paddingBottom: 100,
  },
  gridWrapper: {
    flex: 1,
  },
  itemCard: {
    flex: 1,
    margin: 6,
    aspectRatio: 0.8,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#EBEBEB",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  itemImage: {
    width: 40,
    height: 40,
  },
  itemName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1A1A1A",
    textAlign: "center",
    minHeight: 30,
    marginTop: 6,
    paddingHorizontal: 6,
  },
  itemCount: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1A1A1A",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    marginTop: 40,
  },
  emptyStateText: {
    color: "#999",
    fontSize: 16,
  },
  closeContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  closeButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  closeSvg: {
    width: 24,
    height: 24,
    tintColor: "#FFF",
  },
});
