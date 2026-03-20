import { Image } from "expo-image";
import React, { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGameStore } from "@/stores/game-store";

const coinIcon = require("@/assets/image/assets_images_icons_misc_coins.webp");

interface MarketItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: any;
  tag?: { label: string; color: string; bgColor: string };
}

const COSMETICS_DATA: MarketItem[] = [
  {
    id: "border_golden",
    name: "Golden Harvest Border",
    description: "A shimmering golden frame for champions",
    price: 500,
    image: require("@/assets/image/assets_images_icons_avatarborder_border_golden_harvest.webp"),
    tag: { label: "Popular", color: "#B8860B", bgColor: "#FFF8DC" }, // Golden tag
  },
  {
    id: "border_emerald",
    name: "Emerald Vine Border",
    description: "Lush green vines wrap your profile",
    price: 350,
    image: require("@/assets/image/assets_images_icons_avatarborder_border_emerald_vine.webp"),
  },
  {
    id: "border_rustic",
    name: "Rustic Barn Border",
    description: "Weathered wood planks from the old barn",
    price: 250,
    image: require("@/assets/image/assets_images_icons_avatarborder_border_rustic_barn.webp"),
  },
  {
    id: "bg_golden_meadow",
    name: "Golden Meadow",
    description: "Warm sunset hues over rolling fields",
    price: 500,
    image: require("@/assets/image/assets_images_farmmap_backgrounds_goldenmeadowbg.webp"),
    tag: { label: "New", color: "#0066CC", bgColor: "#E6F0FA" }, // Blue tag
  },
  {
    id: "bg_misty",
    name: "Misty Morning",
    description: "Peaceful fog drifts across your farm at dawn",
    price: 450,
    image: require("@/assets/image/assets_images_farmmap_backgrounds_mistymorningbg.webp"),
  },
];

interface MarketModalProps {
  visible: boolean;
  onClose: () => void;
}

export const MarketModal = ({ visible, onClose }: MarketModalProps) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<"Cosmetics" | "Potions" | "Boosts">("Cosmetics");

  const coins = useGameStore((state) => state.coins);
  const removeCoins = useGameStore((state) => state.removeCoins);

  const handlePurchase = (item: MarketItem) => {
    if (coins >= item.price) {
      removeCoins(item.price);
      // In a real app, deposit cosmetic to inventory/profile here
      alert(`Purchased ${item.name}!`);
    } else {
      alert("Not enough coins!");
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={[styles.container, { paddingTop: insets.top }]}>
        
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Header Row */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Image source={coinIcon} style={styles.headerIcon} contentFit="contain" />
              <View>
                <Text style={styles.titleText}>Coin Market</Text>
                <Text style={styles.subtitleText}>Rare items for dedicated farmers</Text>
              </View>
            </View>
          </View>

          {/* Segmented Control */}
          <View style={styles.segmentedControl}>
            {(["Cosmetics", "Potions", "Boosts"] as const).map((tab) => (
              <Pressable
                key={tab}
                style={[styles.segment, activeTab === tab && styles.segmentActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.segmentText, activeTab === tab && styles.segmentTextActive]}>
                  {tab}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Banner Promo */}
          <Pressable style={styles.banner}>
            <View style={styles.bannerLeft}>
              <Image source={coinIcon} style={styles.bannerIcon} contentFit="contain" />
              <View>
                <Text style={styles.bannerTitle}>Need more coins?</Text>
                <Text style={styles.bannerSubtitle}>Visit the Shop</Text>
              </View>
            </View>
            <Text style={styles.bannerArrow}>›</Text>
          </Pressable>

          {/* Items List */}
          {activeTab === "Cosmetics" ? (
            <View style={styles.listContainer}>
              {COSMETICS_DATA.map((item) => {
                const canAfford = coins >= item.price;
                
                return (
                  <View key={item.id} style={styles.card}>
                    <View style={styles.cardLeft}>
                      <Image source={item.image} style={styles.cardCover} contentFit="contain" />
                      <View style={styles.cardInfo}>
                        <View style={styles.cardTitleRow}>
                          <Text style={styles.cardTitle}>{item.name}</Text>
                          <Text style={styles.eyeIcon}>👁️</Text>
                        </View>
                        <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
                      </View>
                    </View>

                    <View style={styles.cardRight}>
                      {item.tag && (
                        <View style={[styles.tagContainer, { backgroundColor: item.tag.bgColor }]}>
                          {item.tag.label === "Popular" && <Text style={styles.tagStar}>⭐</Text>}
                          <Text style={[styles.tagText, { color: item.tag.color }]}>{item.tag.label}</Text>
                        </View>
                      )}
                      
                      <Pressable 
                        style={[styles.buyButton, !canAfford && styles.buyButtonDisabled]} 
                        onPress={() => handlePurchase(item)}
                      >
                        <Text style={styles.buyButtonText}>{item.price}</Text>
                        <Image source={coinIcon} style={styles.buyButtonIcon} contentFit="contain" />
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>More items coming soon...</Text>
            </View>
          )}

        </ScrollView>

        {/* Floating Close Button */}
        <View style={[styles.closeContainer, { paddingBottom: insets.bottom + 20 }]}>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeIcon}>X</Text>
          </Pressable>
        </View>

      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIcon: {
    width: 32,
    height: 32,
    marginRight: 12,
  },
  titleText: {
    fontSize: 24,
    fontWeight: "900",
    color: "#111",
  },
  subtitleText: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: "#F4F5F7",
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  segmentActive: {
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#7A828A",
  },
  segmentTextActive: {
    color: "#111",
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#EBF5FF",
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  bannerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  bannerIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111",
  },
  bannerSubtitle: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  bannerArrow: {
    fontSize: 24,
    color: "#555",
    fontWeight: "300",
  },
  listContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#EBEBEB",
    borderRadius: 16,
    padding: 16,
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  cardCover: {
    width: 48,
    height: 48,
    marginRight: 16,
  },
  cardInfo: {
    flex: 1,
    paddingRight: 8,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111",
    marginRight: 6,
  },
  eyeIcon: {
    fontSize: 14,
    opacity: 0.6,
  },
  cardDesc: {
    fontSize: 13,
    color: "#777",
    marginTop: 4,
    lineHeight: 18,
  },
  cardRight: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  tagContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  tagStar: {
    fontSize: 10,
    marginRight: 4,
  },
  tagText: {
    fontSize: 10,
    fontWeight: "800",
  },
  buyButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  buyButtonDisabled: {
    opacity: 0.5,
  },
  buyButtonText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#111",
    marginRight: 6,
  },
  buyButtonIcon: {
    width: 16,
    height: 16,
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
  },
  emptyStateText: {
    color: "#888",
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
  closeIcon: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "700",
  },
});
