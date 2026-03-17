import React from "react";
import { StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BottomTabInset, Spacing } from "@/constants/theme";

export default function ShopScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle">Shop</ThemedText>
      <ThemedText themeColor="textSecondary">
        Buy boosts, packs, and special offers from the in-game store.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.six,
    paddingBottom: BottomTabInset + Spacing.three,
    gap: Spacing.two,
  },
});
