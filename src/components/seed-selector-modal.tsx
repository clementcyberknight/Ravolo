import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  ScrollView,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useInventoryStore } from "@/store/inventory-store";
import { useFarmStore } from "@/store/farm-store";
import { CROP_GUIDE, CropType } from "@/constants/crops";

const SEEDLING_ASSET_MAP: Record<string, any> = {
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

interface SeedSelectorModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SeedSelectorModal = ({ visible, onClose }: SeedSelectorModalProps) => {
  const insets = useSafeAreaInsets();
  const items = useInventoryStore((state) => state.items);
  const setSelectedCropId = useFarmStore((state) => state.setSelectedCropId);

  const toLocalCropId = (seedId: string): CropType => {
    const rawId = seedId.startsWith("seed:") ? seedId.slice("seed:".length) : seedId;

    switch (rawId) {
      case "coffee":
        return "coffee_beans";
      case "tea":
        return "tea_leaves";
      case "sapling":
        return "sapling_patch";
      default:
        return rawId as CropType;
    }
  };

  // Filter for actual seed inventory only.
  const seeds = Object.values(items).filter(
    (item) => item.type === "seed" && item.quantity > 0
  );

  const handleSelect = (cropId: CropType) => {
    setSelectedCropId(cropId as CropType);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <Pressable style={styles.dismissArea} onPress={onClose} />
        <View style={[styles.content, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.handle} />
          
          <View style={styles.header}>
            <Text style={styles.title}>Select a Seed</Text>
            <Text style={styles.subtitle}>Pick a seed, then tap empty plots to plant</Text>
          </View>

          {seeds.length > 0 ? (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.scrollContent}
            >
              {seeds.map((seed) => {
                const cropId = toLocalCropId(seed.id);

                return (
                  <Pressable 
                    key={seed.id} 
                    style={styles.seedCard}
                    onPress={() => handleSelect(cropId)}
                  >
                    <View style={styles.imageContainer}>
                      <Image
                        source={SEEDLING_ASSET_MAP[cropId]}
                        style={styles.seedImage}
                        contentFit="contain"
                      />
                    </View>
                    <Text style={styles.seedName}>
                      {CROP_GUIDE[cropId]?.name || cropId}
                    </Text>
                    <View style={styles.quantityBadge}>
                      <Text style={styles.quantityText}>x{seed.quantity}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Text style={styles.emptyEmoji}>📭</Text>
              </View>
              <Text style={styles.emptyTitle}>Out of Seeds!</Text>
              <Text style={styles.emptySubtitle}>Visit the market to buy more seeds or wait for harvests.</Text>
              <Pressable style={styles.marketButton} onPress={onClose}>
                <Text style={styles.marketButtonText}>Got it</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  dismissArea: {
    flex: 1,
  },
  content: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    minHeight: 300,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#032018",
    fontFamily: "Space Grotesk",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 20,
  },
  seedCard: {
    width: 120,
    height: 160,
    backgroundColor: "#DAF8B7",
    borderRadius: 24,
    padding: 12,
    alignItems: "center",
    justifyContent: "space-between",
  },
  imageContainer: {
    flex: 1,
    justifyContent: "center",
  },
  seedImage: {
    width: 60,
    height: 60,
  },
  seedName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#032018",
    marginBottom: 8,
  },
  quantityBadge: {
    backgroundColor: "#032018",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  quantityText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  emptyContainer: {
    alignItems: "center",
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyEmoji: {
    fontSize: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#032018",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  marketButton: {
    backgroundColor: "#032018",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 16,
  },
  marketButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
});
