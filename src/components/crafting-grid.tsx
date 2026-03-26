import {
  BuildingId,
  BUILDINGS_CONFIG,
  RECIPES,
} from "@/constants/crafting-config";
import { useCraftingStore } from "@/store/crafting-store";
import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { RecipeModal } from "./recipe-modal";

const hammerIcon = require("@/assets/image/assets_images_icons_misc_hammer_tool.webp");
const diamondIcon = require("@/assets/image/assets_images_icons_misc_diamonds.webp");

const useTick = () => {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);
  return tick;
};

const formatTimeShort = (seconds: number) => {
  if (seconds <= 0) return "Ready!";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

export const CraftingGrid = () => {
  const tick = useTick();
  const buildings = useCraftingStore((state) => state.buildings);
  const storeTick = useCraftingStore((state) => state.tick);
  const collectProduct = useCraftingStore((state) => state.collectProduct);
  const unlockSlot = useCraftingStore((state) => state.unlockSlot);

  const [selectedBuilding, setSelectedBuilding] = useState<BuildingId | null>(
    null,
  );
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    storeTick();
  }, [tick]);

  const handleOpenRecipeModal = (bId: BuildingId) => {
    setSelectedBuilding(bId);
    setModalVisible(true);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.list}>
        {Object.values(buildings).map((b) => {
          const config = BUILDINGS_CONFIG[b.id];
          const canUpgrade = true; // Mock

          return (
            <View key={b.id} style={styles.buildingCard}>
              {/* Header */}
              <View style={styles.cardHeader}>
                <Image
                  source={config.asset}
                  style={styles.buildingIcon}
                  contentFit="contain"
                />
                <View style={styles.headerInfo}>
                  <View style={styles.titleRow}>
                    <Text style={styles.buildingName}>{config.name}</Text>
                    <Text style={styles.arrow}>›</Text>
                  </View>
                  <Text style={styles.levelText}>
                    Level {b.level} •{" "}
                    <Text style={styles.upgradeText}>Upgrade available</Text>
                  </Text>
                </View>
                <Pressable style={styles.upgradeBtn}>
                  <Image source={hammerIcon} style={styles.hammerIcon} />
                </Pressable>
              </View>

              {/* Slots */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.slotsRow}
              >
                {/* Active/Queued Items */}
                {b.queue.map((item, index) => {
                  const recipe = RECIPES[item.recipeId];
                  const isReady = item.status === "ready";
                  const isProducing = item.status === "producing";

                  let progress = 0;
                  let timeLeft = 0;
                  if (isProducing && item.startTime && item.finishTime) {
                    const total = item.finishTime - item.startTime;
                    const elapsed = Date.now() - item.startTime;
                    progress = Math.min(100, (elapsed / total) * 100);
                    timeLeft = Math.max(
                      0,
                      Math.ceil((item.finishTime - Date.now()) / 1000),
                    );
                  }

                  return (
                    <Pressable
                      key={`${b.id}-item-${index}`}
                      style={[styles.slot, isReady && styles.slotReady]}
                      onPress={() => isReady && collectProduct(b.id, index)}
                    >
                      <Image
                        source={recipe.asset}
                        style={styles.itemIcon}
                        contentFit="contain"
                      />
                      <Text style={styles.recipeName}>{recipe.name}</Text>
                      <Text
                        style={[
                          styles.statusText,
                          isReady && styles.statusReady,
                        ]}
                      >
                        {isReady
                          ? "Ready!"
                          : isProducing
                            ? formatTimeShort(timeLeft)
                            : "Queued"}
                      </Text>
                      {isProducing && (
                        <View style={styles.miniProgressBg}>
                          <View
                            style={[
                              styles.miniProgressFill,
                              { width: `${progress}%` },
                            ]}
                          />
                        </View>
                      )}
                    </Pressable>
                  );
                })}

                {/* Empty Slot (Tap to craft) */}
                {b.queue.length < b.unlockedSlots && (
                  <Pressable
                    style={[styles.slot, styles.slotEmpty]}
                    onPress={() => handleOpenRecipeModal(b.id)}
                  >
                    <Text style={styles.plusIcon}>+</Text>
                    <Text style={styles.emptyText}>Tap to craft</Text>
                    <Text style={styles.holdText}>
                      Hold for {RECIPES[config.recipes[0]].name}
                    </Text>
                  </Pressable>
                )}

                {/* Next Lockable Slot */}
                {b.unlockedSlots < config.maxSlots && (
                  <Pressable
                    style={[styles.slot, styles.slotLocked]}
                    onPress={() => unlockSlot(b.id)}
                  >
                    <View style={styles.lockPriceRow}>
                      <Text style={styles.lockPrice}>
                        {config.slotUnlockCosts[
                          b.unlockedSlots - config.initialSlots
                        ] || 999}
                      </Text>
                      <Image source={diamondIcon} style={styles.miniDiamond} />
                    </View>
                    <Text style={styles.addSlotText}>Add Crafting Slot</Text>
                  </Pressable>
                )}
              </ScrollView>
            </View>
          );
        })}
      </View>

      <RecipeModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        buildingId={selectedBuilding}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 120,
  },
  list: {
    gap: 16,
  },
  buildingCard: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  buildingIcon: {
    width: 60,
    height: 60,
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  buildingName: {
    fontSize: 22,
    fontWeight: "900",
    color: "#1A1A1A",
  },
  arrow: {
    fontSize: 20,
    color: "#CCC",
    marginTop: -2,
  },
  levelText: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  upgradeText: {
    color: "#4CAF50",
    fontWeight: "600",
  },
  upgradeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FCE8B2",
    alignItems: "center",
    justifyContent: "center",
  },
  hammerIcon: {
    width: 24,
    height: 24,
    tintColor: "#A67C00",
  },
  slotsRow: {
    flexDirection: "row",
    gap: 12,
  },
  slot: {
    width: 140,
    height: 100,
    borderRadius: 16,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },
  slotReady: {
    backgroundColor: "#E8F5E9",
    borderColor: "#81C784",
  },
  slotEmpty: {
    borderStyle: "dashed",
    borderColor: "#CCC",
    backgroundColor: "transparent",
  },
  slotLocked: {
    backgroundColor: "#F3E5F5",
    borderColor: "#CE93D8",
  },
  itemIcon: {
    width: 40,
    height: 40,
    marginBottom: 4,
  },
  recipeName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#444",
    textAlign: "center",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#999",
    marginTop: 2,
  },
  statusReady: {
    color: "#4CAF50",
  },
  miniProgressBg: {
    width: "80%",
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
    marginTop: 4,
    overflow: "hidden",
  },
  miniProgressFill: {
    height: "100%",
    backgroundColor: "#7BC47F",
  },
  plusIcon: {
    fontSize: 32,
    color: "#CCC",
    fontWeight: "300",
  },
  emptyText: {
    fontSize: 11,
    color: "#888",
    textAlign: "center",
    marginTop: 2,
  },
  holdText: {
    fontSize: 9,
    color: "#BBB",
    textAlign: "center",
    marginTop: 0,
  },
  lockPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  lockPrice: {
    fontSize: 16,
    fontWeight: "900",
    color: "#9C27B0",
  },
  miniDiamond: {
    width: 14,
    height: 14,
  },
  addSlotText: {
    fontSize: 10,
    color: "#9C27B0",
    textAlign: "center",
    fontWeight: "600",
  },
});
