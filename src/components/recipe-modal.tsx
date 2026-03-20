import { Image } from "expo-image";
import React from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCraftingStore } from "@/stores/crafting-store";
import { useInventoryStore } from "@/stores/inventory-store";
import { useGameStore } from "@/stores/game-store";
import { RECIPES, BUILDINGS_CONFIG, BuildingId, RecipeId } from "@/constants/crafting-config";
import { ASSET_MAP } from "./inventory-modal";

const closeIconSvg = require("@/assets/icons/x-close.svg");
const clockIcon = require("@/assets/image/assets_images_icons_misc_clock.webp");
const lightningIcon = require("@/assets/image/assets_images_icons_misc_lightning.webp");
const lockIcon = require("@/assets/image/assets_images_icons_misc_lock.webp");

interface RecipeModalProps {
  visible: boolean;
  onClose: () => void;
  buildingId: BuildingId | null;
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m > 0 && s > 0) return `${m}m ${s}s`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
};

export const RecipeModal = ({ visible, onClose, buildingId }: RecipeModalProps) => {
  const insets = useSafeAreaInsets();
  const userLevel = useGameStore((state) => state.level);
  const inventory = useInventoryStore((state) => state.items);
  const startCrafting = useCraftingStore((state) => state.startCrafting);

  if (!visible || !buildingId) return null;

  const config = BUILDINGS_CONFIG[buildingId];
  const allRecipes = config.recipes.map((id) => RECIPES[id]);
  
  const craftable = allRecipes.filter((r) => r.levelRequired <= userLevel);
  const locked = allRecipes.filter((r) => r.levelRequired > userLevel);

  const handleStartCrafting = (recipeId: RecipeId) => {
    const success = startCrafting(buildingId, recipeId);
    if (success) {
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={[styles.container, { paddingTop: insets.top + 40 }]}>
        <View style={styles.content}>
          
          <View style={styles.header}>
            <Image source={config.asset} style={styles.buildingMiniIcon} contentFit="contain" />
            <View>
              <Text style={styles.headerTitle}>Select a Recipe</Text>
              <Text style={styles.headerSubtitle}>Choose an item to craft in this building</Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Craftable Section */}
            {craftable.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionIcon}>🔨</Text>
                  <Text style={styles.sectionTitle}>CRAFTABLE</Text>
                </View>
                <View style={styles.grid}>
                  {craftable.map((recipe) => {
                    const canAfford = recipe.ingredients.every(
                      (ing) => (inventory[ing.id]?.quantity || 0) >= ing.amount
                    );

                    return (
                      <Pressable 
                        key={recipe.id} 
                        style={[styles.recipeCard, !canAfford && styles.recipeCardDisabled]}
                        onPress={() => handleStartCrafting(recipe.id)}
                      >
                        <View style={styles.cardTop}>
                          <Image source={recipe.asset} style={styles.recipeIcon} contentFit="contain" />
                          <View style={styles.recipeDetails}>
                            <Text style={styles.recipeName}>{recipe.name}</Text>
                            <View style={styles.timeRow}>
                              <Image source={clockIcon} style={styles.clockIcon} />
                              <Text style={styles.timeText}>{formatTime(recipe.durationSec)}</Text>
                              <Image source={lightningIcon} style={styles.lightningIcon} />
                            </View>
                          </View>
                          <View style={styles.quantityBadge}>
                            <Text style={styles.quantityText}>{inventory[recipe.id]?.quantity || 0}</Text>
                            <View style={styles.cubeIcon} />
                          </View>
                        </View>

                        <View style={styles.ingredientsRow}>
                          {recipe.ingredients.map((ing) => {
                            const have = inventory[ing.id]?.quantity || 0;
                            const isMissing = have < ing.amount;
                            return (
                              <View key={ing.id} style={[styles.ingredientChip, isMissing && styles.ingredientChipMissing]}>
                                <Image source={ASSET_MAP[ing.id]} style={styles.ingIcon} contentFit="contain" />
                                <Text style={[styles.ingText, isMissing && styles.ingTextMissing]}>
                                  {have}/{ing.amount}
                                </Text>
                              </View>
                            );
                          })}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}

            {/* Locked Section */}
            {locked.length > 0 && (
              <>
                <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                  <Text style={styles.sectionIcon}>🔒</Text>
                  <Text style={styles.sectionTitle}>LOCKED</Text>
                </View>
                <View style={styles.grid}>
                  {locked.map((recipe) => (
                    <View key={recipe.id} style={[styles.recipeCard, styles.recipeCardLocked]}>
                      <View style={styles.cardTop}>
                        <Image source={recipe.asset} style={[styles.recipeIcon, { opacity: 0.5 }]} contentFit="contain" />
                        <View style={styles.recipeDetails}>
                          <Text style={[styles.recipeName, { color: "#999" }]}>{recipe.name}</Text>
                          <View style={styles.timeRow}>
                            <Image source={clockIcon} style={[styles.clockIcon, { opacity: 0.5 }]} />
                            <Text style={[styles.timeText, { color: "#AAA" }]}>{formatTime(recipe.durationSec)}</Text>
                            <Image source={lightningIcon} style={[styles.lightningIcon, { opacity: 0.5 }]} />
                          </View>
                        </View>
                        <Image source={lockIcon} style={styles.lockIcon} />
                      </View>
                      <View style={styles.lockInfo}>
                        <Text style={styles.unlockText}>Unlocks at Level {recipe.levelRequired}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </>
            )}
          </ScrollView>

          <Pressable style={styles.closeButton} onPress={onClose}>
            <Image source={closeIconSvg} style={styles.closeIcon} />
          </Pressable>

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  content: {
    backgroundColor: "#FAFAFA",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: "85%",
    padding: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
    paddingRight: 40,
  },
  buildingMiniIcon: {
    width: 48,
    height: 48,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#1A1A1A",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  sectionIcon: {
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#666",
    letterSpacing: 0.5,
  },
  grid: {
    gap: 12,
  },
  recipeCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  recipeCardDisabled: {
    backgroundColor: "#F9F9F9",
  },
  recipeCardLocked: {
    backgroundColor: "#F5F5F5",
    borderColor: "#E0E0E0",
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  recipeIcon: {
    width: 56,
    height: 56,
    marginRight: 12,
  },
  recipeDetails: {
    flex: 1,
  },
  recipeName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1A1A1A",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  clockIcon: {
    width: 14,
    height: 14,
    tintColor: "#A67C00",
  },
  timeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#A67C00",
  },
  lightningIcon: {
    width: 14,
    height: 14,
    tintColor: "#FFD700",
  },
  quantityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#333",
  },
  cubeIcon: {
    width: 12,
    height: 12,
    backgroundColor: "#A67C00",
    borderRadius: 2,
  },
  ingredientsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  ingredientChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FFF4",
    borderWidth: 1,
    borderColor: "#C6F6D5",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  ingredientChipMissing: {
    backgroundColor: "#FFF5F5",
    borderColor: "#FED7D7",
  },
  ingIcon: {
    width: 16,
    height: 16,
  },
  ingText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#2F855A",
  },
  ingTextMissing: {
    color: "#C53030",
  },
  lockIcon: {
    width: 20,
    height: 20,
    tintColor: "#BBB",
  },
  lockInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  unlockText: {
    color: "#CC3333",
    fontSize: 12,
    fontWeight: "700",
  },
  closeButton: {
    position: "absolute",
    top: 24,
    right: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E0E0E0",
    alignItems: "center",
    justifyContent: "center",
  },
  closeIcon: {
    width: 20,
    height: 20,
    tintColor: "#666",
  },
});
