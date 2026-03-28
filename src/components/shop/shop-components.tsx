import React, { memo } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Image, 
  ViewStyle, 
  TextStyle,
  Platform
} from "react-native";
import { Spacing, Fonts } from "@/constants/theme";

// --- THEME COLORS ---
const D = "#032018"; // Dark Green
const L = "#DAF8B7"; // Light Green
const W = "#FFFFFF"; // White
const R = "#FF383C"; // Ravolo Red
const G = "#71B312"; // Ravolo Green

// --- TYPES ---
interface ShopTabButtonProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
}

// --- COMPONENTS ---

export const ShopTabButton = memo(({ label, isActive, onPress }: ShopTabButtonProps) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    style={[
      styles.tabButton,
      { backgroundColor: isActive ? D : "transparent" }
    ]}
  >
    <Text style={[
      styles.tabButtonText,
      { color: isActive ? W : D }
    ]}>
      {label}
    </Text>
  </TouchableOpacity>
));

export const ShopBadge = memo(({ text, color = R }: { text: string; color?: string }) => (
  <View style={[styles.badge, { backgroundColor: color }]}>
    <Text style={styles.badgeText}>{text}</Text>
  </View>
));

interface ItemPriceProps {
  price: number;
  oldPrice?: number;
  isToken?: boolean;
}

export const ItemPrice = memo(({ price, oldPrice, isToken }: ItemPriceProps) => (
  <View style={styles.priceContainer}>
    {oldPrice && (
      <Text style={styles.oldPriceText}>
        {isToken ? `$${oldPrice.toFixed(2)}` : oldPrice}
      </Text>
    )}
    <View style={[styles.pricePill, { backgroundColor: isToken ? D : G }]}>
      <Text style={styles.priceText}>
        {isToken ? `$${price.toFixed(2)}` : price}
      </Text>
    </View>
  </View>
));

export const SectionHeader = memo(({ title, subtitle, icon }: { title: string; subtitle?: string; icon?: any }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {subtitle && (
      <View style={styles.subtitleRow}>
        {icon && <Image source={icon} style={styles.miniIcon} resizeMode="contain" />}
        <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      </View>
    )}
  </View>
));

// --- STYLES ---

const styles = StyleSheet.create({
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: Fonts.mono,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  badgeText: {
    color: W,
    fontSize: 8,
    fontWeight: "800",
    fontFamily: Fonts.mono,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  oldPriceText: {
    color: D,
    fontSize: 8,
    opacity: 0.25,
    textDecorationLine: "line-through",
    fontFamily: Fonts.mono,
  },
  pricePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
  },
  priceText: {
    color: W,
    fontSize: 10,
    fontWeight: "800",
    fontFamily: Fonts.mono,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    color: D,
    fontSize: 12,
    fontWeight: "700",
    fontFamily: Fonts.mono,
  },
  subtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  miniIcon: {
    width: 10,
    height: 10,
    opacity: 0.6,
  },
  sectionSubtitle: {
    color: D,
    fontSize: 10,
    opacity: 0.4,
    fontFamily: Fonts.mono,
  },
});
